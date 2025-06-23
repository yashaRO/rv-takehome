import {
  EventSubscriber,
  EntitySubscriberInterface,
  UpdateEvent,
} from "typeorm";
import { Deal } from "./Deal";
import { AuditLog } from "../audit-logs/AuditLog";

@EventSubscriber()
export class DealSubscriber implements EntitySubscriberInterface<Deal> {
  /**
   * Indicates that this subscriber only listen to Deal events.
   */
  listenTo() {
    return Deal;
  }

  /**
   * Called after entity update.
   */
  afterUpdate(event: UpdateEvent<Deal>) {
    const { entity, databaseEntity, updatedColumns, updatedRelations } = event;

    if (!entity || !databaseEntity) {
      return;
    }

    // Create audit log for sales_rep changes
    const salesRepColumn = updatedColumns.find(col => col.propertyName === 'sales_rep');
    if (salesRepColumn) {
      this.createSalesRepAuditLog(entity as Deal, databaseEntity as Deal, event);
    }

    // Log updated relations if any
    if (updatedRelations.length > 0) {
      console.log("Updated relations:", updatedRelations.map(rel => rel.propertyName));
    }
  }

  /**
   * Called before entity update (optional - for additional logging).
   */
  beforeUpdate(event: UpdateEvent<Deal>) {
    const { entity } = event;
    
    if (entity) {
      console.log("🔄 Deal about to be updated - ID:", entity.id, "Deal ID:", entity.deal_id);
    }
  }

  /**
   * Creates an audit log entry when sales_rep is changed.
   */
  private async createSalesRepAuditLog(
    entity: Deal,
    databaseEntity: Deal,
    event: UpdateEvent<Deal>
  ) {
    try {
      const auditLogRepository = event.manager.getRepository(AuditLog);
      
      const auditLog = auditLogRepository.create({
        table_name: "deals",
        column_name: "sales_rep",
        previous_value: databaseEntity.sales_rep || "",
        new_value: entity.sales_rep || "",
      });

      await auditLogRepository.save(auditLog);
      
      console.log("✅ Audit log created for sales_rep change:", {
        deal_id: entity.deal_id,
        previous_sales_rep: databaseEntity.sales_rep,
        new_sales_rep: entity.sales_rep,
        audit_log_id: auditLog.id
      });
    } catch (error) {
      console.error("❌ Failed to create audit log for sales_rep change:", {
        deal_id: entity.deal_id,
        error: error instanceof Error ? error.message : error
      });
    }
  }
}
