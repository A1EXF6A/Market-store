import { IncidentsController } from '../../src/incidents/incidents.controller';
import { IncidentsService } from '../../src/incidents/incidents.service';
import { ItemStatus } from '../../src/entities/enums';

describe('IncidentsController (unit)', () => {
  let controller: IncidentsController;
  let service: any;

  beforeEach(() => {
    service = {
      createReport: jest.fn(async (dto, buyerId) => ({ ...dto, buyerId } as any)),
      createAppeal: jest.fn(async (dto, sellerId) => ({ ...dto, sellerId } as any)),
      getIncidents: jest.fn(async () => []),
      getReports: jest.fn(async () => []),
      getReportIncidentsCount: jest.fn(async (id: number) => ({ count: id })),
      createIncidentFromReport: jest.fn(async () => ({ incidentId: 1 } as any)),
      getSellerIncidents: jest.fn(async () => []),
      assignModerator: jest.fn(async () => ({ incidentId: 1 } as any)),
      resolveIncident: jest.fn(async () => ({ incidentId: 1, status: ItemStatus.ACTIVE } as any)),
    };
    controller = new IncidentsController(service as any);
  });

  const user = { userId: 10 } as any;

  it('createReport delegates to service with userId', async () => {
    const dto = { itemId: 5, type: 'spam', comment: 'x' } as any;
    const res = await controller.createReport(dto, user);
    expect(service.createReport).toHaveBeenCalledWith(dto, 10);
    expect(res).toBeDefined();
  });

  it('createIncidentFromReport passes id, description and userId', async () => {
    const body = { description: 'd' } as any;
    await controller.createIncidentFromReport('7', body, user);
    expect(service.createIncidentFromReport).toHaveBeenCalledWith(7, 'd', 10);
  });

  it('assignModerator passes ids correctly', async () => {
    await controller.assignModerator('8', 22 as any, user);
    expect(service.assignModerator).toHaveBeenCalledWith(8, 10, 22);
  });

  it('resolveIncident passes id, status and moderator', async () => {
    await controller.resolveIncident('9', ItemStatus.ACTIVE, user);
    expect(service.resolveIncident).toHaveBeenCalledWith(9, ItemStatus.ACTIVE, 10);
  });
});
