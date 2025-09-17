import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ModelService {
  constructor(public toastController:ToastController) {}
  async presentToast() {
    const toast = await this.toastController.create({
      message: 'ທ່ານອອກຈາກລະບົບສຳເລັດແລ້ວ',
      duration: 2000,
      position: 'bottom',
      mode: 'ios',
      color: 'dark'
    });
    toast.present();
  }
}
export interface IOrderAssigned {riderUuid:string,orderUuid:string,storeUuid:string}
export enum ECommand {
  ping = 'ping',
  login = "login",
  orderAssigned = "orderAssigned",
  storeaccepted = "storeaccepted"
}

export interface IReqModel {
  transactionID?: number;
  command: any;
  data: any;
  time: string;
  ip: string;
  token: string;
  limit: number;
  skip: number;
}

export interface ISocketData{
  command:ECommand,
  token?:string,
  time?:Date,
  data?:any
}

export enum EPaymentStatus {
  paid = 'paid',
  partial = 'partial',
  unpaid = 'unpaid',
  debt = 'debt',
  canceled = 'canceled'
}
export interface ICart {
  storeUuid: string;
  product: IProduct
  isAddon: boolean
  qtty:number;
  value:number;
  ttqtty:number;
  ttvalue:number;
}

export interface IBase {
  id?: number;
  uuid?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // deletedAt?:Date;
}
export interface IProductPost {
  ownerUuid: string;
  primaryProduct: IProductDetails;
  secondaryProducts: Array<IProductDetailsCompact>;
  addons: Array<IProductDetailsCompact>;
  productType: string;
  tags: Array<string>;
  prices: Array<number>;
  min: number;
  max: number;
  average: number;
  expiry_date: Date;
  saleCode: string;
  description: string;
  district: string;
  province: string;
  storeType: string;
}
export interface IProductDetails {
  inventory: IStock, product: IProduct
}
export interface IProductStocks {
  stock: Array<IStock>, product:Array<IProduct>
}
export interface IProductDetailsCompact {
  inventUuid: string, productUuid: string
}
export interface IProduct extends IBase {
  productTypes: string;
  productCode: string;
  productSN: string;
  manufacturer: string;
  weight: string;
  name: string;
  image: string;//path[]
  description: string;
  brand: string;
  unit: string;
  sku: string;
  tags: Array<string>;
  storeType: string;
  storeUuid: string;
  moreDetail: any;
  mrp: string;
  pic?:any;
  product?:any;
}
export interface ISpec {
  color: string;
  dimensionPackage: string;
  dimensionNet: string;
  size: string;
  weight: string
}


export interface IStock extends IBase {
  productUuid: string;
  qtt: number;
  ttqtty: number;
  value: number;
  ttvalue: number;
  description: string;
  bywhom: string;
  direction: EDirection;
  expired: Date | undefined;
  ref: string;
}

export enum EDirection {
  sell = 'sell',
  defective = 'defective',
  expired = 'expired',
  lost = 'lost',
  stolen = 'stolen',
  warranty = 'warranty',
  others = 'others',


  purchase = 'purchase',
  reimport = 'reimport',
  transfer = 'transfer'
}
export interface IInventoryPS {
  primary: IStock,
  secondary: Array<IStock>
}
export interface IResponse {
  data:any;
 message: string,
 code: string,
 status: number
}
export interface IResponseInventory extends IResponse {
  data: IInventoryPS;

}



export interface IStoreConfig {
  storeUuid: string;
  rangefee: Array<IRangeFee>; //jsonb
  packagefee: Array<IPackageFee>; //jsonb
  location: IAddress; //jsonb
  paymentMethodUuid: Array<string>;
  shipmentMethodUuid: Array<string>;
}
export interface IRangeFee {
  radius: number;
  fee: number;
}
export interface IPackageFee {
  fee: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  volume: number;
}

export interface IPaymentMethod extends IBase {
  name: string;
  logo: string;
  description: string;
  feerange: Array<IPaymentMethodFee>;
}
export interface IShipmentMethod extends IBase {
  name: string;
  logo: string;
  description: string;
  feerange: Array<IShipmentMethodFee>;
}

export interface IShipmentMethodFee {
  width: number;
  length: number;
  height: number;
  volume: number;
  weight: number;
  fee: number
}
export interface IPaymentMethodFee {
  fee: number;
  max: number;
}

export interface IAddress extends IBase {
  storeUuid: string;
  name: string;
  address: string;
  road: string;
  village: string;
  district: string;
  province: string;
  country: string;
  description: string;
  location: IGPSLocation;
}
export interface IGPSLocation {
  lat: number;
  lng: number;
  alt: number;
  gpsTime: string;
  serverTime: string;
}



export enum Currency{
  Laa = "Laa",
  Lab = "Lab",
  Lax = "Lax",
  Lak = "Lak",
  Gol = "Gol",
  Gen = "Gen",
  Gen2 = "Gen2",
  Asset = "asset"
}



// ============ order =====================

export interface Iorder{
  order:IOrder,detail:IOrderDetails
}
export interface IOrder extends IBase {
  orderStatus:EOrderStatus; // enum order status
  customerName:string; //
  customerToken:string; //
  totalQuantity:number;
  totalValue:number;
  paymentType:any;
  shipmentDetails:any;
  storeUuid:string;
}
// orderDetails
export interface IOrderDetails extends IBase{
  orderUuid:string;
  itemUuid:string; // ==> product uuid
  quantity:number;
  value:number;
  totalValue:number;
  addons:any;
}

export enum EOrderStatus {
  cancel = 'cancel',
  new='new', //new order
  accepted='accepted',
  pending='pending', // waiting for store send request to rider or wait user pay order
  waiting='waiting', // waiting for delivery
  delivering = 'delivering',//4 keep monitoring after issue invoice
  delivered = 'delivered',//5 waiting for receipt after payment
  completed='completed',
  rider_accepted='rider_accepted',
  pickup='pickup', // waiting for user


  quotation = 'quotation', // 1 placed order not yet paid
  booked = 'booked', // 2  reserved is as the same as quotation
  ordered = 'ordered', //3  issue invoice
  pos = 'pos' //  6. pos type as not for online selling,
}

export enum EMACHINE_COMMAND {
  LIGHTSOFF = 'LIGHTSOFF',
  login = 'login',
  ping = 'ping',
  status = 'status',
  confirm = "confirm",
  note_credit = "note_credit",
  CREDIT_NOTE = "CREDIT_NOTE",
  READ_NOTE = "READ_NOTE",
  NOTE_REJECTED = "NOTE_REJECTED",
  JAMMED = "JAMMED",
  start = "start",
  stop = "stop",
  setcounter = "setcounter",
  restart = "restart",
  logs = "logs",
  confirmOrder = "confirmOrder",
  shippingcontrol = 'shippingcontrol',
  temp = "temp",
  balance = "balance",
  limiter = "limiter",
  DISABLE = "DISABLE",
  ENABLE = "ENABLE",
  SYNC = 'SYNC',
  setpoll = 'setpoll',
  version = "version",
  dropdetectstatus = "dropdetectstatus",
  arrayoutputstatus = "arrayoutputstatus",
  arrayinputstatus = "arrayinputstatus",
  relaycommand = "relaycommand",
  swversion = "swversion",
  hutemp = "hutemp",
  statusgrid = "statusgrid",
  hwversion = "hwversion",
  getSN = "getSN",
  READ_EVENTS = "READ_EVENTS",
  POLL = "POLL",
  RESET = "RESET",
  ACCEPT = "ACCEPT",
  SET_POLL = "SET_POLL",
  GET_SN = "GET_SN",
  READ_TEMP = "READ_TEMP",
  DISPENSE = "DISPENSE",
  READ_SWITCH_OUTPUT = "READ_SWITCH_OUTPUT",
  READ_SWITCH_INPUT = "READ_SWITCH_INPUT",
  SET_ADDRESS = "SET_ADDRESS",
  SET_PULSE_COUNT = "SET_PULSE_COUNT",
  REJECT = "REJECT",
  START_MOTOR = "START_MOTOR",
  SET_TEMP = "SET_TEMP",
  CLEAR_RESULT = "CLEAR_RESULT",
  ERROR = "ERROR",
  INIT = "INIT",
  CLOSE = "CLOSE",
  LISTPORTS = "LISTPORTS",
  GETSERIALEVENTS = "GETSERIALEVENTS",
  GETFIRMWAREVERSION = "GETFIRMWAREVERSION",
  UNLOCK = "UNLOCK",
  READALLLOCKSTATUS = "READALLLOCKSTATUS",
  ONETOUCHUNLOCK = "ONETOUCHUNLOCK",
  LIGHTS = "LIGHTS",
  SETCHANNELINHIBITS = "SETCHANNELINHIBITS",
  GETSERIALNUMBER = "GETSERIALNUMBER",
  SETUPREQUEST = "SETUPREQUEST",
  DISPENSED = "DISPENSED",
  DISPENSEFAILED = "DISPENSEFAILED",
  UNKNOWN = "UNKNOWN",
  MACHINE_STATUS = "MACHINE_STATUS",
  VMC_MACHINE_STATUS = "VMC_MACHINE_STATUS",
  VMC_DISPENSEFAILED = "VMC_DISPENSEFAILED",
  VMC_DISPENSED = "VMC_DISPENSED",
  VMC_DISPENSE = "VMC_DISPENSE",
  VMC_CREDIT_NOTE = "VMC_CREDIT_NOTE",
  VMC_UNKNOWN = "VMC_UNKNOWN",
  SET_LIGHT = "SET_LIGHT",
  VMC_BANK_SWALLOWED = "VMC_BANK_SWALLOWED",
  MOTOR_SCAN = "MOTOR_SCAN",
  SCAN_DOOR = "SCAN_DOOR",
  START_MOTOR_MERGED = "START_MOTOR_MERGED",
  QUERY_SWAP = "QUERY_SWAP",
  SET_SWAP = "SET_SWAP",
  SET_TWO_WIRE_MODE = "SET_TWO_WIRE_MODE",
  READ_ID = "READ_ID",
  ADH814_STATUS = "ADH814_STATUS"

}

export interface IClientId {
  clientId: string;
}
export interface IBillProcess {
  ownerUuid: string;
  transactionID: number;
  position: number;
  bill: IVendingMachineBill;
}

export interface IVendingMachineBill extends IBase, IBC {
  vendingsales: Array<IVendingMachineSale>;
  totalvalue: number;
  paymentmethod: string;
  paymentstatus: string;
  paymentref: string;
  paymenttime: Date;
  requestpaymenttime: Date;
  machineId: string;
  clientId: string;
  transactionID: number;
  qr: string;
}

export interface IVendingMachineSale extends IBase, IBC {
  stock: IStock;
  position: number;
  machineId: string;
  max: number;
}

export interface IBC {
  hashP: string;
  hashM: string;

}

export interface IAlive {
  time: Date
  isAlive: boolean;
  test: boolean;
  balance: number;
  data: any;
  message?: string
}

export interface IBillProcess {
  ownerUuid: string;
  transactionID: number;
  position: number;
  bill: IVendingMachineBill;
}

export interface IBillProcess {
  ownerUuid: string;
  transactionID: number;
  position: number;
  bill: IVendingMachineBill;
}

export interface IResModel {
  transactionID?: number;
  command: any;
  data: any;
  message: string;
  status: number;
}

export enum EMessage {
  loginfailed = 'login failed',
  succeeded = 'succeeded',
  error = 'error',
  insertSucceeded = 'inserting succeeded',
  insertError = 'inserting error',
  updateSucceeded = 'updating succeeded',
  updateError = 'updating error',
  deletingSucceeded = 'deleting succeeded',
  deletingerror = 'deleting error',
  notfound = 'not found',
  exist = 'exist',
  bodyIsEmpty = "body is empty",
  idIsEmpty = "id is empty",
  unknownError = "unknown Error",
  selectOneSucceeded = "select One Succeeded",
  selectOneError = "select One Error",
  selectManySucceeded = "select Many Succeeded",
  selectManyError = "select Many Error",
  generateSucceeded = "find Succeeded",
  findError = "find Error",
  resetdatasucceeded = "resetdatasucceeded",
  joinsucceeded = "joinsucceeded",
  joinfailed = "joinfailed",
  submisionsucceeded = "submisionsucceeded",
  submisionfailed = "submisionfailed",
  coinconfirmsumissionsucceeded = "coinconfirmsumissionsucceeded",
  coinconfirmsubmissionfailed = "coinconfirmsubmissionfailed",
  transactionnotfound = "transactionnotfound",
  gamestartedsucceeded = "gamestartedsucceeded",
  gamestartedfailed = "gamestartedfailed",
  submissionclosedsucceeded = "submissionclosedsucceeded",
  submissionclosedfailed = "submissionclosedfailed",
  gamehasnotbeenstarted = "gamehasnotbeenstarted",
  all = "all",
  getallgamersucceeded = "getallgamersucceeded",
  getallgamerfailed = "getallgamerfailed",
  gammernotfound = "gammernotfound",
  valueisoverthebudget = "valueisoverthebudget",
  listrewardsucceeded = "listrewardsucceeded",
  listrewardfailed = "listrewardfailed",
  rewardnotfound = "rewardnotfound",
  commandnotfound = "commandnotfound",
  methodnotfound = "methodnotfound",
  gamestatusfailed = "gamestatusfailed",
  gamestatusok = "gamestatusok",
  closethegamesucceeded = "closethegamesucceeded",
  closethegamefailed = "closethegamefailed",
  connectionestablished = "connectionestablished",
  gamerhasbeenjoined = "gamerhasbeenjoined",
  createrewardsucceeded = "createrewardsucceeded",
  createrewardfailed = "createrewardfailed",
  deleterewardsucceeded = "deleterewardsucceeded",
  deleterewardfailed = "deleterewardfailed",
  winnernotfound = "winnernotfound",
  randomcoinsucceeded = "randomcoinsucceeded",
  randomcoinfailed = "randomcoinfailed",
  couldnotfindphonenumber = "couldnotfindphonenumber",
  loadexchangesucceeded = "loadexchangesucceeded",
  loadexchangefailed = "loadexchangefailed",
  loadtotalcoinsucceeded = "loadtotalcoinsucceeded",
  loadtotalcoinfailed = "loadtotalcoinfailed",
  loadcoinsucceeded = "loadcoinsucceeded",
  loadcoinfailed = "loadcoinfailed",
  showphonenumberfailed = "showphonenumberfailed",
  showphonenumbersucceeded = "showphonenumbersucceeded",
  showallresultssucceeded = "showallresultssucceeded",
  showallresultsfailed = "showallresultsfailed",
  createanewgamesucceeded = "createanewgamesucceeded",
  createanewgamefailed = "createanewgamefailed",
  rewardselected = "rewardselected",
  cointypesdidntmatched = "cointypesdidntmatched",
  updategamefailed = "updategamefailed",
  updategamesucceeded = "updategamesucceeded",
  endgamefailed = "endgamefailed",
  endgamesucceeded = "endgamesucceeded",
  cleargamesucceeded = "cleargamesucceeded",
  cleargamefailed = "cleargamefailed",
  showcurrentgamessucceeded = "showcurrentgamessucceeded",
  showcurrentgamefailed = "showcurrentgamefailed",
  selectedgamenotfound = "selectedgamenotfound",
  gamenotfound = "gamenotfound",
  pong = "pong",
  findoldadssucceeded = "findoldadssucceeded",
  findoldadsfailed = "findoldadsfailed",
  findadssucceeded = "findadssucceeded",
  findaddedfailed = "findaddedfailed",
  findadsfailed = "findadsfailed",
  createdadssucceeded = "createdadssucceeded",
  createdadsfailed = "createdadsfailed",
  imageistoolarge = "imageistoolarge",
  findoldsponsorlist = "findoldsponsorlist",
  findoldsponsorlistfailed = "findoldsponsorlistfailed",
  findoldsponsorlistsucceeded = "findoldsponsorlistsucceeded",
  findsponsorlistfailed = "findsponsorlistfailed",
  findsponsorlistsucceeded = "findsponsorlistsucceeded",
  createsponsorsucceeded = "createsponsorsucceeded",
  createsponsorfailed = "createsponsorfailed",
  updatesponsorfailed = "updatesponsorfailed",
  updatesponsorsucceeded = "updatesponsorsucceeded",
  somecointypenotfound = "somecointypenotfound",
  reporttotalmembervaluesucceeded = "reporttotalmembervaluesucceeded",
  reporttotalmembervaluefailed = "reporttotalmembervaluefailed",
  reporttotalmemberjoinedgamesucceeded = "reporttotalmemberjoinedgamesucceeded",
  reporttotalmemberjoinedgamefailed = "reporttotalmemberjoinedgamefailed",
  updateadsfailed = "updateadsfailed",
  updateadssucceeded = "updateadssucceeded",
  assignedtothegamesucceeded = "assignedtothegamesucceeded",
  assignedtothegamefailed = "assignedtothegamefailed",
  closethecoinsubmission = "closethecoinsubmission",
  gameclosed = "gameclosed",
  listrewardselectedgame = "listrewardselectedgame",
  checkcoinsubmission = "checkcoinsubmission",
  checkcoinsubmissionfailed = "checkcoinsubmissionfailed",
  turnonsumissionselectedgame = "turnonsumissionselectedgame",
  notallowed = "notallowed",
  phoneNumberNotExist = "phoneNumberNotExist",
  gettotalclientconnectionfailed = "gettotalclientconnectionfailed",
  gettotalclientconnectionsucceeded = "gettotalclientconnectionsucceeded",
  addownertothegamefailed = "addownertothegamefailed",
  addownertothegamesucceeded = "addownertothegamesucceeded",
  removeonwerfromthegamefailed = "removeonwerfromthegamefailed",
  removeonwerfromthegamesucceeded = "removeonwerfromthegamesucceeded",
  notexist = "notexist",
  showgameshardssucceeded = "showgameshardssucceeded",
  showgameshardsfailed = "showgameshardsfailed",
  checkphonenumbersucceeded = "checkphonenumbersucceeded",
  checkphonenumberfailed = "checkphonenumberfailed",
  IncorrectFormat = "IncorrectFormat",
  cannotreomvethefinalowner = "cannotreomvethefinalowner",
  couldnotremovesuperadmin = "couldnotremovesuperadmin",
  turnonsumissionselectedgamefailed = "turnonsumissionselectedgamefailed",
  checkjoinstatusok = "checkjoinstatusok",
  quitgamefailed = "quitgamefailed",
  quitgameok = "quitgameok",
  loadjoinstatusfailed = "loadjoinstatusfailed",
  ThereIsNoAnyCoins = "ThereIsNoAnyCoins",
  foundPhonenumber = "foundPhonenumber",
  tokenNotFound = "tokenNotFound",
  showallonlineconnection = "showallonlineconnection",
  SubmittedCoinIsZeroValue = "SubmittedCoinIsZeroValue",
  commandsucceeded = "commandsucceeded",
  MachineIdNotFound = "MachineIdNotFound",
  processingorder = "processingorder",
  loginok = "loginok",
  notloggedinyet = "notloggedinyet",
  notsupport = "notsupport",
  billnotfound = "billnotfound",
  confirmsucceeded = "confirmsucceeded",
  openstock = "openstock"
}