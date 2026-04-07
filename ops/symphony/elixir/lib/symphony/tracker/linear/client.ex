defmodule Symphony.Tracker.Linear.Client do
  @moduledoc """
  Read-only Linear GraphQL client for initial issue polling.
  """

  alias Symphony.Workflow

  @endpoint "https://api.linear.app/graphql"

  def fetch_active_issues(tracker) do
    with {:ok, api_key} <- fetch_api_key(tracker),
         {:ok, project_slug} <- Workflow.project_slug(tracker),
         {:ok, active_states} <- Workflow.active_states(tracker),
         {:ok, projects} <- list_projects(api_key),
         {:ok, project} <- find_project(projects, project_slug),
         {:ok, issues} <- list_project_issues(api_key, project["id"]) do
      {:ok, filter_active_issues(issues, active_states)}
    end
  end

  def find_project(projects, project_slug) when is_list(projects) do
    normalized_slug = normalize_slug(project_slug)

    case Enum.find(projects, &project_match?(&1, normalized_slug)) do
      nil -> {:error, {:project_not_found, project_slug}}
      project -> {:ok, project}
    end
  end

  def filter_active_issues(issues, active_states) do
    Enum.filter(issues, fn issue ->
      get_in(issue, ["state", "name"]) in active_states
    end)
  end

  defp fetch_api_key(%{"api_key" => value}), do: Workflow.resolve_env_value(value)
  defp fetch_api_key(_tracker), do: {:error, :missing_api_key}

  defp list_projects(api_key) do
    query = """
    query SymphonyProjects {
      projects(first: 100) {
        nodes {
          id
          name
          slugId
        }
      }
    }
    """

    with {:ok, %{"projects" => %{"nodes" => nodes}}} <- post_graphql(api_key, query, %{}) do
      {:ok, nodes}
    end
  end

  defp list_project_issues(api_key, project_id) do
    query = """
    query SymphonyProjectIssues($projectId: String!) {
      project(id: $projectId) {
        issues(first: 100) {
          nodes {
            id
            identifier
            title
            priority
            updatedAt
            state {
              name
              type
            }
            assignee {
              id
              name
            }
          }
        }
      }
    }
    """

    with {:ok, %{"project" => %{"issues" => %{"nodes" => nodes}}}} <-
           post_graphql(api_key, query, %{projectId: project_id}) do
      {:ok, nodes}
    end
  end

  defp post_graphql(api_key, query, variables) do
    body = Jason.encode!(%{query: query, variables: variables})

    request =
      Finch.build(
        :post,
        @endpoint,
        [
          {"content-type", "application/json"},
          {"authorization", api_key}
        ],
        body
      )

    with {:ok, %Finch.Response{status: 200, body: response_body}} <-
           Finch.request(request, Symphony.Finch),
         {:ok, decoded} <- Jason.decode(response_body),
         {:ok, data} <- extract_data(decoded) do
      {:ok, data}
    else
      {:ok, %Finch.Response{status: status, body: response_body}} ->
        {:error, {:linear_http_error, status, response_body}}

      {:error, reason} ->
        {:error, {:linear_request_failed, reason}}
    end
  end

  defp extract_data(%{"data" => data}) when is_map(data), do: {:ok, data}
  defp extract_data(%{"errors" => errors}), do: {:error, {:linear_graphql_errors, errors}}
  defp extract_data(_payload), do: {:error, :invalid_linear_response}

  defp normalize_slug(slug) do
    slug
    |> String.downcase()
    |> String.trim()
  end

  defp project_match?(project, normalized_slug) do
    slug_id = normalize_slug(project["slugId"] || "")
    name_slug =
      project["name"]
      |> to_string()
      |> String.downcase()
      |> String.replace(~r/[^a-z0-9]+/u, "-")
      |> String.trim("-")

    slug_id == normalized_slug or
      String.starts_with?(slug_id, normalized_slug <> "-") or
      name_slug == normalized_slug
  end
end
