import { BuildOptions, DataTypes, Model, ModelAttributes, Sequelize } from 'sequelize';
import * as uuid from 'uuid';
export interface IProductShowcase {
  id?: number;
  uuid?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  ownerUuid?: string;
  stockId: number;
  globalProductId?: string;
  title?: string;
  html?: string;
  story?: string;
  price?: number;
  video?: string;
  photos?: string[];
  holdMs?: number;
  videoMs?: number;
  hashP?: string;
}

export function showcaseContentHash(s: Partial<IProductShowcase>): string {
  const payload = JSON.stringify({
    title: s.title || '',
    html: s.html || '',
    story: s.story || '',
    price: Number(s.price) || 0,
    video: s.video || '',
    photos: s.photos || [],
    holdMs: Number(s.holdMs) || 10000,
    videoMs: Number(s.videoMs) || 12000,
  });
  let h = 0;
  for (let i = 0; i < payload.length; i++) h = (Math.imul(31, h) + payload.charCodeAt(i)) | 0;
  return 'h' + (h >>> 0).toString(16);
}

interface IProductShowcaseAttribute extends IProductShowcase {}
export interface ProductShowcaseModel
  extends Model<IProductShowcaseAttribute>,
    IProductShowcaseAttribute {}
export class ProductShowcase extends Model<ProductShowcaseModel, IProductShowcaseAttribute> {}

export type ProductShowcaseStatic = typeof Model & {
  new (values?: object, options?: BuildOptions): ProductShowcaseModel;
};

export const ProductShowcaseFactory = (
  name: string,
  sequelize: Sequelize,
): ProductShowcaseStatic => {
  const attributes: ModelAttributes<ProductShowcaseModel> = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      unique: true,
      autoIncrement: true,
      autoIncrementIdentity: true,
    },
    uuid: {
      allowNull: false,
      unique: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ownerUuid: { type: DataTypes.STRING },
    /** real product id = stock.id */
    stockId: { type: DataTypes.INTEGER },
    /** shareable catalog id (same snack on many machines) */
    globalProductId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
    title: { type: DataTypes.STRING },
    html: { type: DataTypes.TEXT },
    story: { type: DataTypes.TEXT },
    price: { type: DataTypes.INTEGER },
    video: { type: DataTypes.STRING },
    photos: { type: DataTypes.JSONB },
    holdMs: { type: DataTypes.INTEGER, defaultValue: 10000 },
    videoMs: { type: DataTypes.INTEGER, defaultValue: 12000 },
    hashP: { type: DataTypes.STRING },
  } as ModelAttributes<ProductShowcaseModel>;

  const x = sequelize.define(name, attributes, { tableName: name, freezeTableName: true });
  x.beforeUpdate(async (o) => {
    if (o.changed('uuid')) o.uuid = o.previous().uuid;
    if (o.changed('id')) o.id = o.previous().id;
    o.createdAt = o.previous().createdAt;
    o.updatedAt = new Date();
  });
  x.beforeCreate(async (o) => {
    if (!o.uuid) o.uuid = uuid.v4();
    if (!o.globalProductId) o.globalProductId = uuid.v4();
  });
  return x as unknown as ProductShowcaseStatic;
};