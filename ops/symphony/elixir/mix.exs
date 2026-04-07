defmodule Symphony.MixProject do
  use Mix.Project

  def project do
    [
      app: :symphony,
      version: "0.1.0",
      elixir: "~> 1.18",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      aliases: aliases()
    ]
  end

  def application do
    [
      mod: {Symphony.Application, []},
      extra_applications: [:logger, :crypto]
    ]
  end

  defp deps do
    [
      {:yaml_elixir, "~> 2.11"},
      {:jason, "~> 1.4"},
      {:finch, "~> 0.19"}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get"],
      check: ["format --check-formatted", "test"]
    ]
  end
end
