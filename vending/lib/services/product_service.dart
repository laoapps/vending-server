import 'dart:convert';

import 'package:get_storage/get_storage.dart';
import 'package:http/http.dart';
import 'package:vending/app/config/config.dart';
import 'package:vending/app/config/headers.dart';

class ProductHttp {
  var storage = GetStorage();
  static loadSaleList(dynamic body) async {
    var url = Uri.parse('${endPoints}/machineSaleList?isActive=yes');
    return post(url, body: json.encode(body), headers: headerData);
  }

  static loadMachineSale(dynamic body) async {
    var url = Uri.parse(endPoints + '/readMachineSale');
    return post(url, body: json.encode(body), headers: headerData);
  }
}
