import 'dart:convert';
import 'package:http/http.dart';

checkResponse(Response response) {
  if (response.statusCode == 200 && jsonDecode(response.body)['status'] == 1) {
    return true;
  } else {
    return false;
  }
}

checkResponseNotfound(Response response) {
  if (response.statusCode == 200 && jsonDecode(response.body)['status'] == 2) {
    return true;
  } else {
    return false;
  }
}
