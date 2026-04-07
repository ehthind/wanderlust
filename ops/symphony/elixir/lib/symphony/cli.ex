defmodule Symphony.CLI do
  @moduledoc """
  Entry point for running the Symphony operator against a repo-local WORKFLOW.md.
  """

  alias Symphony.Orchestrator
  alias Symphony.WorkflowLoader

  def main(argv) do
    workflow_path = List.first(argv) || configured_workflow_path()

    with {:ok, workflow} <- WorkflowLoader.load(workflow_path),
         {:ok, _pid} <- Orchestrator.start_link(workflow) do
      IO.puts("Symphony booted with #{workflow_path}")
      Process.sleep(:infinity)
    else
      {:error, reason} ->
        IO.puts(:stderr, "Symphony failed to boot: #{inspect(reason)}")
        System.halt(1)
    end
  end

  defp configured_workflow_path do
    Application.get_env(:symphony, :workflow_path, "../../../WORKFLOW.md")
  end
end
