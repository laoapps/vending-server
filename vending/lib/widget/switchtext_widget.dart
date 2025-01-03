import 'package:flutter/material.dart';

import '../app/color/main_color.dart';
import '../app/config/config.dart';

class SwitchText extends StatelessWidget {
  final bool value;
  final String text;
  final Function(bool)? onChanged;
  SwitchText(
      {super.key,
      required this.value,
      required this.text,
      required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Transform.scale(
          scale: 1.3,
          child: Switch(
            activeColor: ColorData.mainColor,
            value: value,
            onChanged: onChanged,
          ),
        ),
        Text(
          "  ${text}",
          style: TextStyle(
            fontFamily: font,
            fontSize: MediaQuery.of(context).size.height * 0.013,
            // fontWeight: FontWeight.bold,
          ),
        )
      ],
    );
  }
}
