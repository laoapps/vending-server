import 'package:flutter/material.dart';

import '../../app/color/main_color.dart';
import '../../app/config/config.dart';

class PrefixTextField extends StatelessWidget {
  final String? hintText;
  final IconData? prefixIcon;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final TextInputAction? textInputAction;
  const PrefixTextField(
      {super.key,
      this.hintText,
      this.prefixIcon,
      required this.controller,
      required this.obscureText,
      this.keyboardType,
      this.validator,
      this.textInputAction});

  @override
  Widget build(BuildContext context) {
    double deviceHeight = MediaQuery.of(context).size.height;
    return TextFormField(
      style: TextStyle(
          color: ColorData.mainColor,
          fontFamily: font,
          fontSize: deviceHeight * 0.015),
      validator: validator,
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      cursorColor: ColorData.mainColor,
      textInputAction: textInputAction,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: TextStyle(
          color: ColorData.mainColor,
          fontWeight: FontWeight.bold,
          fontFamily: font,
          fontSize: deviceHeight * 0.015,
        ),
        prefixIcon: Icon(
          prefixIcon,
          color: ColorData.mainColor,
          size: deviceHeight * 0.025,
        ),

        errorStyle: TextStyle(fontFamily: font, fontSize: deviceHeight * 0.015),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(
            10,
          ),
          borderSide: BorderSide(color: ColorData.mainColor, width: 3.0),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: ColorData.mainColor, width: 3.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: ColorData.mainColor, width: 3.0),
        ),
        // contentPadding:
        //     EdgeInsets.symmetric(vertical: 20, horizontal: 15), // เพิ่มช่องว่าง
      ),
    );
  }
}
