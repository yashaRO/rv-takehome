import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  table_name!: string;

  @Column()
  column_name!: string;

  @Column()
  previous_value!: string;

  @Column()
  new_value!: string;

  @CreateDateColumn()
  created_at!: Date;
}
