import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';

class Showtoast {
  static success(String msg) {
    Fluttertoast.showToast(msg: msg, gravity: ToastGravity.TOP);
  }

  static error(String msg) {
    Fluttertoast.showToast(
        msg: msg,
        gravity: ToastGravity.TOP,
        textColor: Colors.red,
        backgroundColor: Colors.white);
  }
}
