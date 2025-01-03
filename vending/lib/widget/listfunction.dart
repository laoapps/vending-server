import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../app/color/main_color.dart';
import '../app/config/config.dart';

class ListOfFunction extends StatelessWidget {
  final Function()? onTap;
  final String title;
  final IconData icon;
  const ListOfFunction(
      {super.key,
      required this.title,
      required this.icon,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    double deviceHeight = MediaQuery.of(context).size.height;
    double deviceWidth = MediaQuery.of(context).size.width;
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: deviceWidth * 0.200,
        height: deviceHeight * 0.13,
        child: Column(
          children: [
            Icon(
              icon,
              size: 50,
              color: ColorData.mainColor,
            ),
            Text(
              title.tr,
              style: TextStyle(fontFamily: font, color: ColorData.mainColor),
            )
          ],
        ),
      ),
    );
  }
}
