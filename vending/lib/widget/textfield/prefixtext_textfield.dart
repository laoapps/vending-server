import 'package:flutter/material.dart';
import '../../app/color/main_color.dart';
import '../../app/config/config.dart';

class PrefixTextTextField extends StatelessWidget {
  final String? hintText;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final TextInputAction? textInputAction;
  final String label;
  PrefixTextTextField(
      {super.key,
      this.hintText,
      required this.controller,
      required this.obscureText,
      this.keyboardType,
      this.validator,
      this.textInputAction,
      required this.label});

  @override
  Widget build(BuildContext context) {
    double deviceHeight = MediaQuery.of(context).size.height;

    return Card(
      elevation: 10,
      child: Padding(
        padding: const EdgeInsets.only(left: 15),
        child: TextFormField(
          style: TextStyle(
              color: Colors.black,
              fontFamily: font,
              fontWeight: FontWeight.bold,
              fontSize: deviceHeight * 0.015),
          validator: validator,
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          cursorColor: ColorData.mainColor,
          textInputAction: textInputAction,
          decoration: InputDecoration(
            prefixIcon: Text('${label}: ',
                style: TextStyle(
                    fontFamily: font,
                    fontSize: deviceHeight * 0.015,
                    fontWeight: FontWeight.bold)),
            labelStyle: TextStyle(
                fontFamily: font,
                color: ColorData.mainColor,
                fontSize: deviceHeight * 0.015),
            hintText: hintText,
            hintStyle: TextStyle(
                color: Colors.grey,
                fontFamily: font,
                fontSize: deviceHeight * 0.013),
            errorStyle:
                TextStyle(fontFamily: font, fontSize: deviceHeight * 0.015),
          ),
        ),
      ),
    );
  }
}
