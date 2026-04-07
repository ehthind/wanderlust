defmodule Symphony.Tracker do
  @moduledoc """
  Dispatches tracker operations based on the workflow contract.
  """

  alias Symphony.Tracker.Linear.Client, as: LinearClient
  alias Symphony.Workflow

  def poll_active_issues(workflow) do
    with {:ok, tracker} <- Workflow.tracker_config(workflow),
         {:ok, kind} <- tracker_kind(tracker) do
      case kind do
        "linear" -> LinearClient.fetch_active_issues(tracker)
        other -> {:error, {:unsupported_tracker, other}}
      end
    end
  end

  defp tracker_kind(%{"kind" => kind}) when is_binary(kind), do: {:ok, kind}
  defp tracker_kind(_tracker), do: {:error, :missing_tracker_kind}
end
