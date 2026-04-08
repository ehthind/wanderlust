import { createTripWorkspaceService } from "./service";

export const getTripWorkspaceModel = (id: string) =>
  createTripWorkspaceService().loadTripWorkspace(id);
