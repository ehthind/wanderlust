defmodule Symphony.Workflow do
  @moduledoc """
  Helpers for reading repo-owned workflow config with resolved environment references.
  """

  def tracker_config(%{config: %{"tracker" => tracker}}) when is_map(tracker), do: {:ok, tracker}
  def tracker_config(_workflow), do: {:error, :missing_tracker_config}

  def workspace_root(%{config: %{"workspace" => %{"root" => root}}}) when is_binary(root), do: root

  def workspace_root(_workflow),
    do: Application.get_env(:symphony, :workspace_root, "../../../.symphony/workspaces")

  def max_concurrent_agents(%{config: %{"agent" => %{"max_concurrent_agents" => count}}})
      when is_integer(count) and count > 0,
      do: count

  def max_concurrent_agents(_workflow), do: 1

  def max_turns(%{config: %{"agent" => %{"max_turns" => turns}}})
      when is_integer(turns) and turns > 0,
      do: turns

  def max_turns(_workflow), do: 8

  def allow_subagents?(%{config: %{"agent" => %{"allow_subagents" => value}}})
      when is_boolean(value),
      do: value

  def allow_subagents?(_workflow), do: false

  def resolve_env_value("$" <> env_var) do
    case System.fetch_env(env_var) do
      {:ok, value} when byte_size(value) > 0 -> {:ok, value}
      _ -> {:error, {:missing_env_var, env_var}}
    end
  end

  def resolve_env_value(value) when is_binary(value), do: {:ok, value}
  def resolve_env_value(_value), do: {:error, :invalid_env_reference}

  def project_slug(%{"project_slug" => slug}) when is_binary(slug), do: {:ok, slug}
  def project_slug(_tracker), do: {:error, :missing_project_slug}

  def active_states(%{"active_states" => states}) when is_list(states), do: {:ok, states}
  def active_states(_tracker), do: {:error, :missing_active_states}
end
