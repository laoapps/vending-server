import 'package:flutter/material.dart';
import '../../app/config/config.dart';

class CustomSelectPaymentWidget extends StatelessWidget {
  final String group;
  final String image;
  final String title;
  final String value;
  final Function onClick;
  const CustomSelectPaymentWidget({
    super.key,
    required this.group,
    required this.image,
    required this.title,
    required this.value,
    required this.onClick,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        onClick();
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Radio(
                splashRadius: 10,
                focusColor: Colors.white,
                fillColor:
                    MaterialStateColor.resolveWith((states) => Colors.black),
                value: value,
                groupValue: group,
                onChanged: (value) {
                  print(value);
                },
              ),
              Text(
                title,
                style: const TextStyle(
                    fontFamily: font, color: Colors.black, fontSize: 10),
              )
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(left: 18),
            child: Card(
              child: Image.asset(
                image,
                fit: BoxFit.cover,
                width: MediaQuery.of(context).size.width * 0.08,
                height: MediaQuery.of(context).size.width * 0.08,
              ),
            ),
          )
        ],
      ),
    );
  }
}
