// File: OrderProcessingService.ts
import { DatabaseService } from "./DatabaseService";
import { APIClient } from "./APIClient";
import { Order } from "./Order";
import { APIException } from "./APIException";
import { DatabaseException } from "./DatabaseException";
import * as fs from "fs";

export class OrderProcessingService {
  private dbService: DatabaseService;
  private apiClient: APIClient;

  constructor(dbService: DatabaseService, apiClient: APIClient) {
    this.dbService = dbService;
    this.apiClient = apiClient;
  }

  async processOrders(userId: number): Promise<Order[] | false> {
    try {
      const orders = await this.dbService.getOrdersByUser(userId);

      for (const order of orders) {
        switch (order.type) {
          case 'A':
            const csvFile = `orders_type_A_${userId}_${Date.now()}.csv`;
            try {
              const fileHandle = fs.createWriteStream(csvFile);
              fileHandle.write('ID,Type,Amount,Flag,Status,Priority\n');
              fileHandle.write(`${order.id},${order.type},${order.amount},${order.flag ? 'true' : 'false'},${order.status},${order.priority}\n`);

              if (order.amount > 150) {
                fileHandle.write(',,,,Note,High value order\n');
              }
              fileHandle.end();
              order.status = 'exported';
            } catch {
              order.status = 'export_failed';
            }
            break;

          case 'B':
            try {
              const apiResponse = await this.apiClient.callAPI(order.id);

              if (apiResponse.status === 'success') {
                if (apiResponse.data.amount >= 50 && order.amount < 100) {
                  order.status = 'processed';
                } else if (apiResponse.data.amount < 50 || order.flag) {
                  order.status = 'pending';
                } else {
                  order.status = 'error';
                }
              } else {
                order.status = 'api_error';
              }
            } catch (error) {
              if (error instanceof APIException) {
                order.status = 'api_failure';
              }
            }
            break;

          case 'C':
            order.status = order.flag ? 'completed' : 'in_progress';
            break;

          default:
            order.status = 'unknown_type';
            break;
        }

        order.priority = order.amount > 200 ? 'high' : 'low';

        try {
          await this.dbService.updateOrderStatus(order.id, order.status, order.priority);
        } catch (error) {
          if (error instanceof DatabaseException) {
            order.status = 'db_error';
          }
        }
      }
      return orders;
    } catch (error) {
      return false;
    }
  }
}