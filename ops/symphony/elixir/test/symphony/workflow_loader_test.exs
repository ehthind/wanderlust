defmodule Symphony.WorkflowLoaderTest do
  use ExUnit.Case, async: true

  alias Symphony.WorkflowLoader

  test "parses workflow config and prompt body" do
    workflow = """
    ---
    tracker:
      kind: linear
    ---
    You are working on a ticket.
    """

    assert {:ok, %{config: %{"tracker" => %{"kind" => "linear"}}, prompt_template: prompt}} =
             WorkflowLoader.parse(workflow)

    assert prompt == "You are working on a ticket."
  end
end
