import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../app/color/main_color.dart';
import '../../app/config/config.dart';
import '../../app/data/languages_key.dart';

class LoadingScreen extends StatelessWidget {
  const LoadingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
          child: CircularProgressIndicator(
        color: ColorData.mainColor,
      )),
    );
  }
}

loadingWidget() {
  return Center(
    child: CircularProgressIndicator(
      color: ColorData.mainColor,
    ),
  );
}

class LoadingWidget extends StatelessWidget {
  const LoadingWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      content: SizedBox(
        height: MediaQuery.of(context).size.height * 0.13,
        child: Column(
          children: [
            // CircularProgressIndicator(
            //   color: ColorData.mainColor,
            // ),
            CircularProgressIndicator(
              color: ColorData.mainColor,
            ),
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.015,
            ),
            Text(
              Lang.loading.tr,
              style: TextStyle(
                  fontFamily: font,
                  fontSize: MediaQuery.of(context).size.width * 0.05),
            )
          ],
        ),
      ),
    );
  }
}
