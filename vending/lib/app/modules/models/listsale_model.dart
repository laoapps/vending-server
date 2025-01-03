// To parse this JSON data, do
//
//     final listSaleModel = listSaleModelFromJson(jsonString);

import 'dart:convert';

List<ListSaleModel> listSaleModelFromJson(String str) =>
    List<ListSaleModel>.from(
        json.decode(str).map((x) => ListSaleModel.fromJson(x)));

String listSaleModelToJson(List<ListSaleModel> data) =>
    json.encode(List<dynamic>.from(data.map((x) => x.toJson())));

class ListSaleModel {
  int? id;
  String? uuid;
  bool? isActive;
  DateTime? createdAt;
  DateTime? updatedAt;
  dynamic hasM;
  dynamic hashP;
  String? machineId;
  Stock? stock;
  int? position;
  int? max;

  ListSaleModel({
    this.id,
    this.uuid,
    this.isActive,
    this.createdAt,
    this.updatedAt,
    this.hasM,
    this.hashP,
    this.machineId,
    this.stock,
    this.position,
    this.max,
  });

  factory ListSaleModel.fromJson(Map<String, dynamic> json) => ListSaleModel(
        id: json["id"],
        uuid: json["uuid"],
        isActive: json["isActive"],
        createdAt: json["createdAt"] == null
            ? null
            : DateTime.parse(json["createdAt"]),
        updatedAt: json["updatedAt"] == null
            ? null
            : DateTime.parse(json["updatedAt"]),
        hasM: json["hasM"],
        hashP: json["hashP"],
        machineId: json["machineId"],
        stock: json["stock"] == null ? null : Stock.fromJson(json["stock"]),
        position: json["position"],
        max: json["max"],
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "uuid": uuid,
        "isActive": isActive,
        "createdAt": createdAt?.toIso8601String(),
        "updatedAt": updatedAt?.toIso8601String(),
        "hasM": hasM,
        "hashP": hashP,
        "machineId": machineId,
        "stock": stock?.toJson(),
        "position": position,
        "max": max,
      };
}

class Stock {
  int? id;
  dynamic hasM;
  String? name;
  int? qtty;
  String? uuid;
  dynamic hashP;
  String? image;
  int? price;
  bool? isActive;
  DateTime? createdAt;
  DateTime? updatedAt;

  Stock({
    this.id,
    this.hasM,
    this.name,
    this.qtty,
    this.uuid,
    this.hashP,
    this.image,
    this.price,
    this.isActive,
    this.createdAt,
    this.updatedAt,
  });

  factory Stock.fromJson(Map<String, dynamic> json) => Stock(
        id: json["id"],
        hasM: json["hasM"],
        name: json["name"],
        qtty: json["qtty"],
        uuid: json["uuid"],
        hashP: json["hashP"],
        image: json["image"],
        price: json["price"],
        isActive: json["isActive"],
        createdAt: json["createdAt"] == null
            ? null
            : DateTime.parse(json["createdAt"]),
        updatedAt: json["updatedAt"] == null
            ? null
            : DateTime.parse(json["updatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "hasM": hasM,
        "name": name,
        "qtty": qtty,
        "uuid": uuid,
        "hashP": hashP,
        "image": image,
        "price": price,
        "isActive": isActive,
        "createdAt": createdAt?.toIso8601String(),
        "updatedAt": updatedAt?.toIso8601String(),
      };
}
