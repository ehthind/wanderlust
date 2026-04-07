defmodule Symphony.WorkflowLoader do
  @moduledoc """
  Loads the repo-owned WORKFLOW.md contract and extracts front matter plus prompt body.
  """

  def load(path) do
    with {:ok, contents} <- File.read(path),
         {:ok, workflow} <- parse(contents) do
      {:ok, Map.put(workflow, :path, path)}
    else
      {:error, _} = error -> error
    end
  end

  def parse(contents) when is_binary(contents) do
    case String.split(contents, "\n---\n", parts: 3) do
      ["---\n" <> front_matter, body] ->
        decode_workflow(front_matter, body)

      [front_matter, body] ->
        decode_workflow(front_matter, body)

      _ ->
        {:error, :invalid_workflow_format}
    end
  end

  defp decode_workflow(front_matter, body) do
    case YamlElixir.read_from_string(front_matter) do
      {:ok, config} when is_map(config) ->
        {:ok, %{config: config, prompt_template: String.trim(body)}}

      {:ok, _other} ->
        {:error, :workflow_front_matter_not_a_map}

      {:error, reason} ->
        {:error, {:workflow_parse_error, reason}}
    end
  end
end
