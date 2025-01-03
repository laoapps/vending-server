import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../app/config/config.dart';
import '../../app/data/languages_key.dart';

class DialogConfirmWidget extends StatelessWidget {
  final Function onClick;
  final String text;
  const DialogConfirmWidget(
      {super.key, required this.text, required this.onClick});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(
        "${Lang.dialogAreYouSure.tr}${text}?",
        style: TextStyle(
            fontFamily: font,
            fontSize: MediaQuery.of(context).size.width * 0.044),
      ),
      actions: [
        TextButton(
            onPressed: () {
              Get.back();
            },
            child: Text(
              Lang.btnCancel.tr,
              style: TextStyle(
                  fontFamily: font,
                  fontSize: MediaQuery.of(context).size.width * 0.04),
            )),
        TextButton(
            onPressed: () {
              Get.back();
              onClick();
            },
            child: Text(
              Lang.btnOK.tr,
              style: TextStyle(
                  fontFamily: font,
                  color: Colors.red,
                  fontSize: MediaQuery.of(context).size.width * 0.04),
            ))
      ],
    );
  }
}
