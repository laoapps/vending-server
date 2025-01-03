import 'package:flutter/material.dart';
import '../../app/color/main_color.dart';
import '../../app/config/config.dart';

class SuffixTextField extends StatelessWidget {
  final String? hintText;
  final IconData? prefixIcon;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final TextInputAction? textInputAction;
  final Widget suffixIcon;
  final Function(String)? onFieldSubmitted;
  const SuffixTextField(
      {super.key,
      this.hintText,
      this.prefixIcon,
      required this.controller,
      required this.obscureText,
      this.keyboardType,
      this.validator,
      this.textInputAction,
      required this.suffixIcon,
      this.onFieldSubmitted});

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      onFieldSubmitted: onFieldSubmitted,
      style: TextStyle(color: ColorData.mainColor, fontFamily: font),
      validator: validator,
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      cursorColor: ColorData.mainColor,
      textInputAction: textInputAction,
      decoration: InputDecoration(
        hintText: hintText,
        suffixIcon: suffixIcon,
        hintStyle: TextStyle(
            color: ColorData.mainColor,
            fontWeight: FontWeight.bold,
            fontFamily: font),
        prefixIcon: Icon(
          prefixIcon,
          color: ColorData.mainColor,
        ),
        errorStyle: const TextStyle(fontFamily: font),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: ColorData.mainColor, width: 1.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: ColorData.mainColor, width: 1.0),
        ),
      ),
    );
  }
}
