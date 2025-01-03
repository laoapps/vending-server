import 'package:flutter/material.dart';

import '../../app/config/config.dart';

class RoundedButton extends StatelessWidget {
  final double? width;
  final double? height;
  final Color? boxColor;
  final double radius;
  final BoxBorder? border;
  final String text;
  final Color? txtColor;
  final double? fontSize;
  final FontWeight? fontWeight;
  final Function onTap;
  const RoundedButton(
      {super.key,
      this.height,
      this.width,
      this.boxColor,
      required this.radius,
      this.border,
      required this.text,
      this.txtColor,
      this.fontSize,
      this.fontWeight,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => onTap(),
      child: Container(
        height: height,
        width: width,
        decoration: BoxDecoration(
            color: boxColor,
            borderRadius: BorderRadius.circular(radius),
            border: border),
        child: Center(
            child: Text(
          text,
          style:
              TextStyle(color: txtColor, fontSize: fontSize, fontFamily: font),
        )),
      ),
    );
  }
}
