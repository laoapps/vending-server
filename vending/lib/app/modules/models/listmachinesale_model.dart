// To parse this JSON data, do
//
//     final listMachineSaleModel = listMachineSaleModelFromJson(jsonString);

import 'dart:convert';

List<ListMachineSaleModel> listMachineSaleModelFromJson(String str) =>
    List<ListMachineSaleModel>.from(
        json.decode(str).map((x) => ListMachineSaleModel.fromJson(x)));

String listMachineSaleModelToJson(List<ListMachineSaleModel> data) =>
    json.encode(List<dynamic>.from(data.map((x) => x.toJson())));

class ListMachineSaleModel {
  int? id;
  int? max;
  Stock? stock;
  bool? isActive;
  int? position;
  String? machineId;
  DateTime? updatedAt;

  ListMachineSaleModel({
    this.id,
    this.max,
    this.stock,
    this.isActive,
    this.position,
    this.machineId,
    this.updatedAt,
  });

  factory ListMachineSaleModel.fromJson(Map<String, dynamic> json) =>
      ListMachineSaleModel(
        id: json["id"],
        max: json["max"],
        stock: json["stock"] == null ? null : Stock.fromJson(json["stock"]),
        isActive: json["isActive"],
        position: json["position"],
        machineId: json["machineId"],
        updatedAt: json["updatedAt"] == null
            ? null
            : DateTime.parse(json["updatedAt"]),
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "max": max,
        "stock": stock?.toJson(),
        "isActive": isActive,
        "position": position,
        "machineId": machineId,
        "updatedAt": updatedAt?.toIso8601String(),
      };
}

class Stock {
  int? id;
  String? name;
  int? qtty;
  String? image;
  int? price;

  Stock({
    this.id,
    this.name,
    this.qtty,
    this.image,
    this.price,
  });

  factory Stock.fromJson(Map<String, dynamic> json) => Stock(
        id: json["id"],
        name: json["name"],
        qtty: json["qtty"],
        image: json["image"],
        price: json["price"],
      );

  Map<String, dynamic> toJson() => {
        "id": id,
        "name": name,
        "qtty": qtty,
        "image": image,
        "price": price,
      };
}
