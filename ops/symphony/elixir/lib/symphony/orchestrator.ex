defmodule Symphony.Orchestrator do
  @moduledoc """
  Minimal GenServer scaffold for a Symphony-style scheduler.

  This service should eventually own:
  - polling Linear
  - dispatch eligibility
  - retry and reconciliation state
  - workspace creation and cleanup
  - Codex app-server process supervision
  """

  use GenServer
  require Logger

  alias Symphony.Tracker
  alias Symphony.Workflow
  alias Symphony.WorkspaceManager

  def start_link(workflow) do
    GenServer.start_link(__MODULE__, workflow, name: __MODULE__)
  end

  @impl true
  def init(workflow) do
    state = %{
      workflow: workflow,
      active_runs: %{},
      retry_queue: %{},
      workspace_root: Workflow.workspace_root(workflow),
      active_issues: [],
      max_concurrent_agents: Workflow.max_concurrent_agents(workflow),
      max_turns: Workflow.max_turns(workflow),
      allow_subagents: Workflow.allow_subagents?(workflow)
    }

    {:ok, state, {:continue, :bootstrap}}
  end

  @impl true
  def handle_continue(:bootstrap, state) do
    :ok = WorkspaceManager.ensure_root(state.workspace_root)
    Logger.info("Symphony orchestrator booted for #{state.workflow.path}")
    Logger.info(
      "Run limits: max_concurrent_agents=#{state.max_concurrent_agents} max_turns=#{state.max_turns} allow_subagents=#{state.allow_subagents}"
    )
    Process.send_after(self(), :poll_linear, 0)
    {:noreply, state}
  end

  @impl true
  def handle_info(:poll_linear, state) do
    case Tracker.poll_active_issues(state.workflow) do
      {:ok, issues} ->
        scheduled_issues = Enum.take(issues, state.max_concurrent_agents)

        Logger.info(
          "Fetched #{length(issues)} active Linear issues; scheduling up to #{length(scheduled_issues)}"
        )

        {:noreply, %{state | active_issues: scheduled_issues}}

      {:error, {:missing_env_var, "LINEAR_API_KEY"}} ->
        Logger.warning("LINEAR_API_KEY is not set; skipping Linear polling")
        {:noreply, state}

      {:error, reason} ->
        Logger.error("Linear poll failed: #{inspect(reason)}")
        {:noreply, state}
    end
  end
end
