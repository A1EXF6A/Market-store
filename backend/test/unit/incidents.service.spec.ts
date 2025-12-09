import { IncidentsService } from '../../src/incidents/incidents.service';
import { Repository } from 'typeorm';
import { Item } from '../../src/entities/item.entity';
import { Report } from '../../src/entities/report.entity';
import { Incident } from '../../src/entities/incident.entity';
import { Appeal } from '../../src/entities/appeal.entity';

function mockRepo<T>() {
  return {
    findOne: jest.fn(),
    save: jest.fn(async (e: any) => e),
    create: jest.fn((e: any) => e),
    find: jest.fn(async () => []),
    update: jest.fn(async () => ({})),
  } as unknown as Repository<T>;
}

describe('IncidentsService (unit)', () => {
  let service: IncidentsService;
  let items: Repository<Item>;
  let reports: Repository<Report>;
  let incidents: Repository<Incident>;
  let appeals: Repository<Appeal>;
  let users: Repository<any>;

  beforeEach(() => {
    items = mockRepo<Item>();
    reports = mockRepo<Report>();
    incidents = mockRepo<Incident>();
    appeals = mockRepo<Appeal>();
    users = mockRepo<any>();
    service = new IncidentsService(
      incidents as any,
      reports as any,
      appeals as any,
      items as any,
      users as any,
    );
  });

  it('createReport debería crear reporte para item existente', async () => {
    (items as any).findOne.mockResolvedValue({ itemId: 10 });
    const dto = { itemId: 10, type: 'spam', comment: 'x' } as any;
    const res = await (service as any).createReport(dto, 2);
    expect(reports.create).toHaveBeenCalled();
    expect(reports.save).toHaveBeenCalled();
    expect(res).toBeDefined();
  });

  it('createIncidentFromReport debería crear incidente desde reporte', async () => {
    (reports as any).findOne.mockResolvedValue({ reportId: 5, itemId: 11, buyerId: 2, type: 'spam' });
    (items as any).findOne.mockResolvedValue({ itemId: 11, sellerId: 123 });
    const res = await (service as any).createIncidentFromReport(5, 'd', 7);
    expect(incidents.create).toHaveBeenCalled();
    expect(incidents.save).toHaveBeenCalled();
    expect(res).toBeDefined();
  });
});
