defmodule Symphony.Tracker.Linear.ClientTest do
  use ExUnit.Case, async: true

  alias Symphony.Tracker.Linear.Client

  test "matches projects by slug and normalized name" do
    projects = [
      %{"id" => "proj_1", "name" => "Wanderlust", "slugId" => "wanderlust"},
      %{"id" => "proj_2", "name" => "Other", "slugId" => "other"}
    ]

    assert {:ok, %{"id" => "proj_1"}} = Client.find_project(projects, "wanderlust")
  end

  test "filters issues to active states only" do
    issues = [
      %{"identifier" => "GOT-1", "state" => %{"name" => "Todo"}},
      %{"identifier" => "GOT-2", "state" => %{"name" => "Done"}}
    ]

    assert [%{"identifier" => "GOT-1"}] = Client.filter_active_issues(issues, ["Todo", "In Progress"])
  end
end
