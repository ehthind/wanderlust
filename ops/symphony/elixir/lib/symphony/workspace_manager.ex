defmodule Symphony.WorkspaceManager do
  @moduledoc """
  Helpers for deterministic per-issue workspace paths.
  """

  def ensure_root(path) when is_binary(path) do
    File.mkdir_p!(path)
    :ok
  end

  def workspace_path(root, issue_identifier) do
    sanitized =
      issue_identifier
      |> String.downcase()
      |> String.replace(~r/[^a-z0-9_-]+/u, "-")

    Path.join(root, sanitized)
  end
end
