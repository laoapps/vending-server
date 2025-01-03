// import 'package:flutter/material.dart';

// class MyHomePage extends StatefulWidget {
//   MyHomePage({Key key, this.title}) : super(key: key);

//   final String title;

//   @override
//   _MyHomePageState createState() => _MyHomePageState();
// }

// class _MyHomePageState extends State<MyHomePage> {
//   double _bottomSheetHeight = 0.5;

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: Text(widget.title),
//       ),
//       body: Center(
//         child: Column(
//           mainAxisAlignment: MainAxisAlignment.center,
//           children: <Widget>[
//             ElevatedButton(
//               onPressed: () {
//                 showModalBottomSheet(
//                   context: context,
//                   builder: (context) {
//                     return StatefulBuilder(
//                       builder: (context, setState) {
//                         return GestureDetector(
//                           onVerticalDragUpdate: (details) {
//                             setState(() {
//                               _bottomSheetHeight = _bottomSheetHeight -
//                                   details.delta.dy /
//                                       MediaQuery.of(context).size.height;
//                               _bottomSheetHeight =
//                                   _bottomSheetHeight.clamp(0.25, 0.75);
//                             });
//                           },
//                           child: DraggableScrollableSheet(
//                             initialChildSize: _bottomSheetHeight,
//                             minChildSize: 0.25,
//                             maxChildSize: 0.75,
//                             builder: (context, scrollController) {
//                               return Container(
//                                 color: Colors.white,
//                                 child: ListView(
//                                   controller: scrollController,
//                                   children: <Widget>[
//                                     // เนื้อหาของ bottom sheet
//                                   ],
//                                 ),
//                               );
//                             },
//                           ),
//                         );
//                       },
//                     );
//                   },
//                 );
//               },
//               child: Text('Show Bottom Sheet'),
//             ),
//           ],
//         ),
//       ),
//     );
//   }
// }
