import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../app/config/config.dart';

class FloatingButtonWidget extends StatelessWidget {
  final String title;
  final Color boxColor;
  final IconData icon;
  final Function? onTap;
  FloatingButtonWidget(
      {super.key,
      required this.title,
      required this.boxColor,
      required this.icon,
      this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap as void Function()?,
      child: Container(
        decoration: BoxDecoration(
            color: boxColor, borderRadius: BorderRadius.circular(5)),
        height: Get.mediaQuery.size.height * 0.045,
        width: Get.mediaQuery.size.height * 0.11,
        padding: EdgeInsets.all(5),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: TextStyle(
                fontFamily: font,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                fontSize: Get.mediaQuery.size.width * 0.02,
              ),
            ),
            Icon(
              icon,
              color: Colors.white,
              size: Get.mediaQuery.size.width * 0.035,
            )
          ],
        ),
      ),
    );
  }
}
