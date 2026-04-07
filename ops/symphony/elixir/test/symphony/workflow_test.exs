defmodule Symphony.WorkflowTest do
  use ExUnit.Case, async: true

  alias Symphony.Workflow

  test "resolves env references from the shell" do
    System.put_env("SYMPHONY_TEST_KEY", "secret-token")

    assert {:ok, "secret-token"} = Workflow.resolve_env_value("$SYMPHONY_TEST_KEY")
  after
    System.delete_env("SYMPHONY_TEST_KEY")
  end

  test "returns an error when env is missing" do
    System.delete_env("SYMPHONY_MISSING_KEY")

    assert {:error, {:missing_env_var, "SYMPHONY_MISSING_KEY"}} =
             Workflow.resolve_env_value("$SYMPHONY_MISSING_KEY")
  end

  test "uses conservative defaults when agent limits are missing" do
    workflow = %{config: %{}}

    assert Workflow.max_concurrent_agents(workflow) == 1
    assert Workflow.max_turns(workflow) == 8
    refute Workflow.allow_subagents?(workflow)
  end

  test "reads agent limits from workflow config" do
    workflow = %{
      config: %{
        "agent" => %{
          "max_concurrent_agents" => 2,
          "max_turns" => 12,
          "allow_subagents" => true
        }
      }
    }

    assert Workflow.max_concurrent_agents(workflow) == 2
    assert Workflow.max_turns(workflow) == 12
    assert Workflow.allow_subagents?(workflow)
  end
end
