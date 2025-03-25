import { Component, OnInit } from '@angular/core';
import  JSConfetti from 'js-confetti'
import { MoveDirection, ClickMode, HoverMode, OutMode, Container, Engine } from "tsparticles-engine";
import { loadFull, } from "tsparticles";
import {IParticlesParams} from 'ng-particles';

@Component({
  selector: 'app-dice',
  templateUrl: './dice.page.html',
  styleUrls: ['./dice.page.scss'],
})
export class DicePage implements OnInit {

  t:any;
  result=-1;
  results =Array<number>();
  lucky=['ໂຊກ','ຫມານ','ລຳ້ລວຍ','ເຮັງເຮັງ','ສຸ່ມ','ຮັ່ງມີ','ຄຳ້ຄູນ'];
  luckyText='ສຸ່ມ';
  jsConfetti = new JSConfetti();
  
   /* or the classic JavaScript object */
   particlesOptions :any =  {
    fullScreen: {
      zIndex: 1
    },
    particles: {
      color: {
        value: [
          "#FFFFFF",
          "#FFd700"
        ]
      },
      move: {
        direction: "bottom",
        enable: true,
        outModes: {
          default: "out"
        },
        size: true,
        speed: {
          min: 1,
          max: 3
        }
      },
      number: {
        value: 30,
        density: {
          enable: true,
          area: 800
        }
      },
      opacity: {
        value: 1,
        animation: {
          enable: false,
          startValue: "max",
          destroy: "min",
          speed: 0.3,
          sync: true
        }
      },
      rotate: {
        value: {
          min: 0,
          max: 30
        },
        direction: "",
        move: true,
        animation: {
          enable: true,
          speed: 10
        }
      },
      tilt: {
        direction: "",
        enable: true,
        move: true,
        value: {
          min: 0,
          max: 360
        },
        animation: {
          enable: true,
          speed: 60
        }
      },
      shape: {
        type: "image",
        options: {
          image: [
            {
              src: "assets/coins/DBK-coin.png",
              width: 96,
              height: 96,
              particles: {
                size: {
                  value: 32
                }
              }
            },
            {
              src: "assets/coins/Best-coin.png",
              width: 96,
              height: 96,
              particles: {
                size: {
                  value: 32
                }
              }
            },
            {
              src: "assets/coins/ETL-coin.png",
              width: 96,
              height: 96,
              particles: {
                size: {
                  value: 32
                }
              }
            },
            {
              src: "assets/coins/hangmi-coin.png",
              width: 96,
              height: 96,
              particles: {
                size: {
                  value: 32
                }
              }
            },
            {
              src: "assets/coins/LAAB-Ver-4.1.png",
              width: 96,
              height: 96,
              particles: {
                size: {
                  value: 32
                }
              }
            },
            {
              src: "assets/coins/Lao-telecom-coin.png",
              width: 96,
              height: 96,
              particles: {
                size: {
                  value: 32
                }
              }
            },
            {
              src: "assets/coins/mahasan-coin.png",
              width: 96,
              height: 96,
              particles: {
                size: {
                  value: 32
                }
              }
            },
            {
              src: "assets/coins/Tplus-coin.png",
              width: 96,
              height: 96,
              particles: {
                size: {
                  value: 32
                }
              }
            },
            {
              src: "assets/coins/Unitel-coin.png",
              width: 96,
              height: 96,
              particles: {
                size: {
                  value: 32
                }
              }
            },
            {
              src: "assets/coins/4M-Supermarket-online.png",
              width: 96,
              height: 96,
              particles: {
                size: {
                  value: 32
                }
              }
            },
            {
              src: "assets/coins/One-miracle coin.png",
              width: 96,
              height: 96,
              particles: {
                size: {
                  value: 32
                }
              }
            },
            // {
            //   src: "https://particles.js.org/images/fruits/avocado.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/banana.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/berries.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/cherry.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/grapes.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/lemon.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/orange.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/peach.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/pear.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/pepper.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/plum.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/star.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/strawberry.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/watermelon.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // },
            // {
            //   src: "https://particles.js.org/images/fruits/watermelon_slice.png",
            //   width: 32,
            //   height: 32,
            //   particles: {
            //     size: {
            //       value: 16
            //     }
            //   }
            // }
          ]
        }
      },
      size: {
        value: {
          min: 2,
          max: 4
        }
      },
      roll: {
        darken: {
          enable: true,
          value: 10
        },
        enlighten: {
          enable: true,
          value: 30
        },
        enable: true,
        speed: {
          min: 15,
          max: 25
        }
      },
      wobble: {
        distance: 10,
        enable: true,
       move: true,
        speed: {
          min: -15,
          max: 15
        }
      }
    }}
  constructor() { 
    

    this.jsConfetti.addConfetti({emojis:['🪙']});
   
  }
  particlesLoaded(container: Container): void {
    console.log(container);
}

async particlesInit(engine: Engine): Promise<void> {
    console.log(engine);

    // Starting from 1.19.0 you can add custom presets or shape here, using the current tsParticles instance (main)
    // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
    // starting from v2 you can add only the features you need reducing the bundle size
    await loadFull(engine);
}
  ngOnInit() {
    this.initRollDice();
    this.luckyText=this.lucky[Math.floor(Math.random()* this.lucky.length)];
  }

  initRollDice(timer=300){
    if(this.t){
      clearInterval(this.t);
    }
    this.t = setInterval(()=>{
      this.rolldice();
    },timer)
  }
  pickResult(){
    this.results.unshift(this.result);
    this.luckyText=this.lucky[Math.floor(Math.random()* this.lucky.length)];
    this.jsConfetti.addConfetti();
  }
  rolldice () {
   
      const result = Math.floor(Math.random() * 60) + 1;
    this.printNumber(result);
    this.flipIt();
  };
  printNumber(number:number) {
    this.result = number;
  }
 

  flipped = false;
  imgSrc = "assets/coins/DBK-coin.png"

  flipIt() {
    this.flipped = !this.flipped;
  }

  
}
