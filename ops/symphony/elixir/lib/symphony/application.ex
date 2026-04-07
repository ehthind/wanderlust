defmodule Symphony.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      {Finch, name: Symphony.Finch}
    ]

    opts = [strategy: :one_for_one, name: Symphony.Supervisor]
    Supervisor.start_link(children, opts)
  end
end
