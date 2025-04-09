// UNIT TESTS WITH JEST

import { OrderProcessingService } from '../src/OrderProcessingService';
import { Order } from '../src/Order';
import { APIResponse } from '../src/APIResponse';
import { APIException } from '../src/APIException';
import { DatabaseException } from '../src/DatabaseException';
import { DatabaseService } from '../src/DatabaseService';
import { APIClient } from '../src/APIClient';

jest.mock('fs', () => ({
    createWriteStream: jest.fn(() => ({
        write: jest.fn(),
        end: jest.fn()
    }))
}));

const createOrder = (id: number, type: string, amount = 100, flag = false): Order => {
    return new Order(id, type, amount, flag);
};

const expectResultStatus = (result: unknown, status: string) => {
    expect(Array.isArray(result) && result[0].status).toBe(status);
};

describe('OrderProcessingService', () => {
    let service: OrderProcessingService;
    let mockDBService: jest.Mocked<DatabaseService>;
    let mockAPIClient: jest.Mocked<APIClient>;

    beforeEach(() => {
        mockDBService = {
            getOrdersByUser: jest.fn(),
            updateOrderStatus: jest.fn()
        };

        mockAPIClient = {
            callAPI: jest.fn()
        };

        service = new OrderProcessingService(mockDBService, mockAPIClient);
    });

    const expectStatus = async (order: Order, expectedStatus: string) => {
        mockDBService.getOrdersByUser.mockResolvedValue([order]);
        mockDBService.updateOrderStatus.mockResolvedValue(true);
        const result = await service.processOrders(order.id);
        expectResultStatus(result, expectedStatus);
    };

    it('returns false if getOrdersByUser throws', async () => {
        mockDBService.getOrdersByUser.mockRejectedValue(new Error());
        const result = await service.processOrders(1);
        expect(result).toBe(false);
    });

    describe.each([
        ['A', 100, false, 'exported'],
        ['C', 50, true, 'completed'],
        ['C', 50, false, 'in_progress'],
        ['Z', 50, false, 'unknown_type']
    ])('basic processing', (type, amount, flag, expected) => {
        it(`processes type ${type} and expects ${expected}`, async () => {
            await expectStatus(createOrder(1, type, amount, flag), expected);
        });
    });

    describe('Type A export failure', () => {
        it('sets status export_failed when fs write fails', async () => {
            const fs = require('fs');
            fs.createWriteStream.mockImplementation(() => { throw new Error(); });

            const order = createOrder(2, 'A', 300);
            mockDBService.getOrdersByUser.mockResolvedValue([order]);
            mockDBService.updateOrderStatus.mockResolvedValue(true);

            const result = await service.processOrders(2);
            expectResultStatus(result, 'export_failed');
        });
    });

    describe('Type B with API scenarios', () => {
        it('api success and processed condition', async () => {
            const order = createOrder(3, 'B', 80);
            const apiOrder = createOrder(3, 'B', 60);
            mockDBService.getOrdersByUser.mockResolvedValue([order]);
            mockAPIClient.callAPI.mockResolvedValue(new APIResponse('success', apiOrder));
            mockDBService.updateOrderStatus.mockResolvedValue(true);

            const result = await service.processOrders(3);
            expectResultStatus(result, 'processed');
        });

        it('api success and pending condition', async () => {
            const order = createOrder(4, 'B', 100, true);
            const apiOrder = createOrder(4, 'B', 20, true);
            mockDBService.getOrdersByUser.mockResolvedValue([order]);
            mockAPIClient.callAPI.mockResolvedValue(new APIResponse('success', apiOrder));
            mockDBService.updateOrderStatus.mockResolvedValue(true);

            const result = await service.processOrders(4);
            expectResultStatus(result, 'pending');
        });

        it('api returns fail response', async () => {
            const order = createOrder(5, 'B', 60);
            mockDBService.getOrdersByUser.mockResolvedValue([order]);
            mockAPIClient.callAPI.mockResolvedValue(new APIResponse('fail', order));
            mockDBService.updateOrderStatus.mockResolvedValue(true);

            const result = await service.processOrders(5);
            expectResultStatus(result, 'api_error');
        });

        it('throws APIException', async () => {
            const order = createOrder(6, 'B', 60);
            mockDBService.getOrdersByUser.mockResolvedValue([order]);
            mockAPIClient.callAPI.mockRejectedValue(new APIException());
            mockDBService.updateOrderStatus.mockResolvedValue(true);

            const result = await service.processOrders(6);
            expectResultStatus(result, 'api_failure');
        });
    });

    it('handles DatabaseException from updateOrderStatus', async () => {
        const order = createOrder(10, 'C', 300, true);
        mockDBService.getOrdersByUser.mockResolvedValue([order]);
        mockDBService.updateOrderStatus.mockRejectedValue(new DatabaseException());

        const result = await service.processOrders(10);
        expectResultStatus(result, 'db_error');
    });

    it('writes Note line when amount > 150 in type A', async () => {
      const fs = require('fs');
      const mockWrite = jest.fn();
      fs.createWriteStream.mockReturnValue({
          write: mockWrite,
          end: jest.fn()
      });

      const order = createOrder(20, 'A', 200); // > 150
      mockDBService.getOrdersByUser.mockResolvedValue([order]);
      mockDBService.updateOrderStatus.mockResolvedValue(true);

      const result = await service.processOrders(20);
      expectResultStatus(result, 'exported');
      expect(mockWrite).toHaveBeenCalledWith(',,,,Note,High value order\n');
    });

  it('sets status error for type B when api returns success but condition unmatched', async () => {
    const order = createOrder(21, 'B', 200, false); // > 100
    const apiOrder = createOrder(21, 'B', 55, false); // >= 50 nhưng order.amount >= 100

    mockDBService.getOrdersByUser.mockResolvedValue([order]);
    mockAPIClient.callAPI.mockResolvedValue(new APIResponse('success', apiOrder));
    mockDBService.updateOrderStatus.mockResolvedValue(true);

    const result = await service.processOrders(21);
    expectResultStatus(result, 'error');
  });

});