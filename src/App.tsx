import { useState, useEffect, useRef } from 'react';
import { Settings, Play, Trophy, Coins, RotateCcw, Zap, Store, Heart, Plus, MessageCircle } from 'lucide-react';
import ThreeGame, { DinoPreview } from './components/ThreeGame';
import { DinoType, DINO_STATS } from './types';
import { audioEngine } from './lib/audio';
import { getEmbeddableUrl } from './lib/utils';
import { Leaderboard } from './components/Leaderboard';
import { Shop } from './components/Shop';
import { Achievements, AchievementData, getLevel, MILESTONES } from './components/Achievements';

const StatBar = ({ label, percentage, color }: { label: string, percentage: number, color: string }) => (
  <div>
    <div className="flex justify-between text-[8px] md:text-[10px] text-white font-black italic tracking-widest uppercase mb-1">
      <span className="drop-shadow-md">{label}</span>
      <span className="drop-shadow-md">{percentage > 0 ? `${Math.round(percentage)}%` : ''}</span>
    </div>
    <div className="w-full bg-[#0a192f] h-2 md:h-3 rounded overflow-hidden border border-[#1b3a57] relative transform -skew-x-12">
      <div className="h-full relative overflow-hidden transition-all duration-300" style={{ width: `${percentage}%`, backgroundImage: `linear-gradient(90deg, #118ab2, ${color})` }}>
         {/* Diagonal lines effect */}
         <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, white 4px, white 8px)' }}></div>
      </div>
    </div>
  </div>
);

const MenuBackground = () => {
    const loopVarRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        const interval = setInterval(() => {
            if (loopVarRef.current) {
                loopVarRef.current.currentTime = 0;
                loopVarRef.current.play().catch(() => {});
            }
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
           <img src={getEmbeddableUrl("https://drive.google.com/uc?export=download&id=1KG2zmornfH2Kx-otNjMqDz_wsGK2aJzb")} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60" />
           <video 
             autoPlay 
             muted 
             loop
             playsInline 
             className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80"
           >
             <source src={getEmbeddableUrl("https://drive.google.com/uc?export=download&id=1dUsUCvEQKV4id7yjDrW-f0A7S5g6J2Ux")} type="video/mp4" />
           </video>
           <video 
             ref={loopVarRef}
             autoPlay
             muted 
             playsInline 
             className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-80"
           >
             <source src={getEmbeddableUrl("https://drive.google.com/uc?export=download&id=15u9UXUtVrFJeAZ6B3nyz0WOVOO9vVRae")} type="video/mp4" />
           </video>
        </>
    );
};

export default function App() {
  const [gameState, setGameState] = useState<'pre_splash' | 'splash' | 'menu' | 'character_select' | 'playing' | 'gameover'>('pre_splash');
  const [selectedDino, setSelectedDino] = useState<DinoType>('velociraptor');
  
  const [lastScore, setLastScore] = useState(0);
  const [lastCoins, setLastCoins] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);

  const [currentScore, setCurrentScore] = useState(0);
  const [currentCoins, setCurrentCoins] = useState(0);
  const [currentFuel, setCurrentFuel] = useState(0);

  const [health, setHealthState] = useState(1);
  const healthRef = useRef(1);
  const setHealth = (val: number | ((prev: number) => number)) => {
     const nextVal = typeof val === 'function' ? val(healthRef.current) : val;
     healthRef.current = nextVal;
     setHealthState(nextVal);
  };
  const [defensePoints, setDefensePoints] = useState(0);
  const [isRobot, setIsRobot] = useState(false);
  const isRobotRef = useRef(false);
  const [forceRevertTrigger, setForceRevertTrigger] = useState(0);

  const [showShop, setShowShop] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showMechaForm, setShowMechaForm] = useState(true);
  const [unlockedItems, setUnlockedItems] = useState<string[]>([]);
  const [activeTrail, setActiveTrail] = useState<string | null>(null);
  const [activeTransform, setActiveTransform] = useState<string | null>(null);
  const [upgrades, setUpgrades] = useState({ speed: 0, doubleJump: false, magnetize: false, maxHealth: 0, fuelCan: 0 });

  const [achievements, setAchievements] = useState<AchievementData>({
      veloDistance: 0,
      obstaclesDestroyed: 0,
      robotTransforms: 0,
      hitSpike: 0,
      hitHole: 0,
      hitTree: 0
  });

  const saveAchievementsData = (data: AchievementData) => {
      setAchievements(data);
      localStorage.setItem('robodino-achievements', JSON.stringify(data));
  };

  const achievementsRef = useRef<AchievementData>({
      veloDistance: 0,
      obstaclesDestroyed: 0,
      robotTransforms: 0,
      hitSpike: 0,
      hitHole: 0,
      hitTree: 0
  });
  
  const [achievementPopup, setAchievementPopup] = useState<{title: string, desc: string} | null>(null);
  const previousLevels = useRef<any>(null);

  useEffect(() => {
     try {
       const savedCoins = localStorage.getItem('robodino-coins');
       if (savedCoins) setTotalCoins(parseInt(savedCoins, 10));
       
       const savedItems = localStorage.getItem('robodino-unlocked');
       if (savedItems) setUnlockedItems(JSON.parse(savedItems));

       const savedTrail = localStorage.getItem('robodino-trail');
       if (savedTrail) setActiveTrail(savedTrail);

       const savedTransform = localStorage.getItem('robodino-transform');
       if (savedTransform) setActiveTransform(savedTransform);

       const savedUpgrades = localStorage.getItem('robodino-upgrades');
       if (savedUpgrades) setUpgrades(JSON.parse(savedUpgrades));

       const savedHighScore = localStorage.getItem('robodino-highscore');
       if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));

       const savedAchievements = localStorage.getItem('robodino-achievements');
       if (savedAchievements) {
           const parsed = JSON.parse(savedAchievements);
           setAchievements(parsed);
           achievementsRef.current = parsed;
           
           previousLevels.current = {
               veloDist: getLevel(parsed.veloDistance, MILESTONES.veloDist),
               obsDest: getLevel(parsed.obstaclesDestroyed, MILESTONES.obsDest),
               robot: getLevel(parsed.robotTransforms, MILESTONES.robot),
               spike: getLevel(parsed.hitSpike, MILESTONES.spike),
               hole: getLevel(parsed.hitHole, MILESTONES.hole),
               tree: getLevel(parsed.hitTree, MILESTONES.tree)
           };
       }
     } catch (e) {}
  }, []);

  useEffect(() => {
      let pendingUpdate = false;
      const saveToState = () => {
          if (pendingUpdate) {
              const current = achievementsRef.current;
              setAchievements({...current});
              localStorage.setItem('robodino-achievements', JSON.stringify(current));
              pendingUpdate = false;

              // Check for level ups
              if (!previousLevels.current) {
                  previousLevels.current = {
                       veloDist: getLevel(current.veloDistance, MILESTONES.veloDist),
                       obsDest: getLevel(current.obstaclesDestroyed, MILESTONES.obsDest),
                       robot: getLevel(current.robotTransforms, MILESTONES.robot),
                       spike: getLevel(current.hitSpike, MILESTONES.spike),
                       hole: getLevel(current.hitHole, MILESTONES.hole),
                       tree: getLevel(current.hitTree, MILESTONES.tree)
                  };
                  return;
              }

              const newVelo = getLevel(current.veloDistance, MILESTONES.veloDist);
              const newObs = getLevel(current.obstaclesDestroyed, MILESTONES.obsDest);
              const newRobot = getLevel(current.robotTransforms, MILESTONES.robot);
              const newSpike = getLevel(current.hitSpike, MILESTONES.spike);
              const newHole = getLevel(current.hitHole, MILESTONES.hole);
              const newTree = getLevel(current.hitTree, MILESTONES.tree);

              const checkLevelUp = (newLevel: number, oldLevel: number, title: string, desc: string) => {
                  if (newLevel > oldLevel) {
                      audioEngine.playAchievement();
                      setAchievementPopup({ title, desc: `${desc} Lv.${newLevel}` });
                      setTimeout(() => setAchievementPopup(null), 3000);
                  }
              };

              checkLevelUp(newVelo, previousLevels.current.veloDist, 'SPEED DEMON', 'Unlocked new Tier');
              checkLevelUp(newObs, previousLevels.current.obsDest, 'BULLDOZER', 'Unlocked new Tier');
              checkLevelUp(newRobot, previousLevels.current.robot, 'MECHA WARRIOR', 'Unlocked new Tier');
              checkLevelUp(newSpike, previousLevels.current.spike, 'PINCUSHION', 'Unlocked new Tier');
              checkLevelUp(newHole, previousLevels.current.hole, 'MINER', 'Unlocked new Tier');
              checkLevelUp(newTree, previousLevels.current.tree, 'LUMBERJACK', 'Unlocked new Tier');

              previousLevels.current = {
                  veloDist: newVelo, obsDest: newObs, robot: newRobot, spike: newSpike, hole: newHole, tree: newTree
              };
          }
      };
      
      const interval = setInterval(saveToState, 1000);

      (window as any).onVeloSpeedDist = (dist: number) => {
          achievementsRef.current.veloDistance += dist;
          pendingUpdate = true;
      };
      (window as any).onObstacleDestroyed = (count: number) => {
          achievementsRef.current.obstaclesDestroyed += count;
          pendingUpdate = true;
      };
      (window as any).onAchievementEvent = (type: string, delta: number) => {
          if (type === 'robot') achievementsRef.current.robotTransforms += delta;
          if (type === 'rock') achievementsRef.current.hitSpike += delta;
          if (type === 'hole') achievementsRef.current.hitHole += delta;
          if (type === 'tree') achievementsRef.current.hitTree += delta;
          pendingUpdate = true;
      }
      return () => {
          clearInterval(interval);
          delete (window as any).onVeloSpeedDist;
          delete (window as any).onObstacleDestroyed;
          delete (window as any).onAchievementEvent;
      };
  }, []);

  const saveCoins = (coins: number) => {
     setTotalCoins(coins);
     localStorage.setItem('robodino-coins', coins.toString());
  };

  const handlePurchase = (cost: number, id: string) => {
     if (totalCoins >= cost && !unlockedItems.includes(id)) {
        saveCoins(totalCoins - cost);
        const newUnlocked = [...unlockedItems, id];
        setUnlockedItems(newUnlocked);
        localStorage.setItem('robodino-unlocked', JSON.stringify(newUnlocked));
     }
  };

  const handleEquip = (type: 'trail' | 'transform', id: string) => {
     if (type === 'trail') {
        setActiveTrail(id);
        localStorage.setItem('robodino-trail', id);
     } else {
        setActiveTransform(id);
        localStorage.setItem('robodino-transform', id);
     }
  };

  const setRobotState = (state: boolean) => {
      setIsRobot(state);
      isRobotRef.current = state;
      if (state) {
          if (typeof (window as any).onAchievementEvent === 'function') {
              (window as any).onAchievementEvent('robot', 1);
          }
          if (selectedDino === 'velociraptor') {
             setDefensePoints(2);
          } else if (selectedDino === 'triceratops') {
             setDefensePoints(3);
          } else {
             setDefensePoints(1);
          }
      } else {
          setDefensePoints(0);
      }
  }

  const startGame = (dinoOverride?: DinoType) => {
    const dinoToUse = dinoOverride || selectedDino;
    audioEngine.init();
    audioEngine.playStartGame();
    audioEngine.playInGameLoop();
    setCurrentScore(0);
    setCurrentCoins(0);
    setCurrentFuel(0);
    setHealth((dinoToUse === 'velociraptor' ? 2 : 1) + (upgrades.maxHealth || 0));
    setDefensePoints(0);
    setRobotState(false);
    setGameState('playing');
  };

  const handleDamage = (obstacleType?: string, score?: number, coins?: number) => {
     if (obstacleType) {
          if (typeof (window as any).onAchievementEvent === 'function') {
              (window as any).onAchievementEvent(obstacleType, 1);
          }
     }
     
     if (isRobotRef.current) {
        setDefensePoints(p => {
           if (p > 0) {
               if (p - 1 <= 0) setForceRevertTrigger(v => v + 1);
               return p - 1;
           }
           return p;
        });
     } else {
        if (healthRef.current > 1) {
            setHealth(healthRef.current - 1);
        } else {
            handleGameOver(score ?? currentScore, coins ?? currentCoins, obstacleType);
        }
     }
  };

  const handleGameOver = (score: number, coins: number, obstacleType?: string) => {
    audioEngine.playDie();
    audioEngine.playHighscoreLoop();
    setLastScore(score);
    setLastCoins(coins);
    saveCoins(totalCoins + coins);
    if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('robodino-highscore', score.toString());
    }
    setGameState('gameover');
  };

  return (
    <div className="min-h-screen bg-[#050a05] text-white font-sans selection:bg-cyan-500/30 flex flex-col relative overflow-hidden">
      {gameState === 'pre_splash' ? (
        <div 
          className="absolute inset-0 bg-black flex items-center justify-center cursor-pointer z-50"
          onClick={() => {
             audioEngine.init();
             audioEngine.playStartAnim();
             setGameState('splash');
          }}
        >
          <div className="text-white text-xl md:text-2xl font-mono animate-pulse font-bold tracking-widest text-cyan-400">CLICK ANYWHERE TO START</div>
        </div>
      ) : gameState === 'splash' ? (
        <div className="absolute inset-0 bg-black z-50 overflow-hidden flex items-center justify-center cursor-pointer" onClick={() => setGameState('menu')}>
          <video 
            autoPlay 
            muted 
            playsInline 
            onEnded={() => setGameState('menu')}
            className="w-full h-full object-cover md:object-contain"
          >
            <source src={getEmbeddableUrl("https://drive.google.com/uc?export=download&id=1_N9PNwXCaTKT6a_4MCH1QK9hmQnvtvlx")} type="video/mp4" />
          </video>
          <div className="absolute bottom-8 right-8 text-white/50 text-xs font-mono">Click to skip</div>
        </div>
      ) : gameState === 'menu' ? (
        <div className="absolute inset-0 bg-black z-50 overflow-hidden flex flex-col items-center justify-center">
           <MenuBackground />

           <div className="relative z-10 flex flex-col items-center mt-12">
              <img src={getEmbeddableUrl("https://drive.google.com/uc?export=download&id=1Nrh-_33S2uito4rR_i71iHre-_uzw0Au")} alt="RoboDino Logo" className="w-72 md:w-[500px] mb-16 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              
              <div className="flex flex-col items-center space-y-6">
                 <button 
                   onClick={() => setGameState('character_select')}
                   className="text-5xl md:text-6xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-white hover:to-cyan-200 transition-all transform hover:scale-110 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] [text-shadow:_0_4px_8px_rgba(0,0,0,0.8)]"
                 >
                   PLAY
                 </button>
                 <button 
                   onClick={() => setShowShop(true)}
                   className="text-2xl md:text-3xl font-bold italic tracking-wider text-gray-300 hover:text-yellow-400 transition-all transform hover:scale-105 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] [text-shadow:_0_2px_4px_rgba(0,0,0,0.8)] mt-8"
                 >
                   SETTINGS
                 </button>
                 <button 
                   onClick={() => {
                       audioEngine.playHighscoreLoop();
                       setGameState('gameover'); // Use gameover screen as highscore view
                   }}
                   className="text-2xl md:text-3xl font-bold italic tracking-wider text-gray-300 hover:text-[#ff00ff] transition-all transform hover:scale-105 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] [text-shadow:_0_2px_4px_rgba(0,0,0,0.8)]"
                 >
                   HIGHSCORES
                 </button>
              </div>
           </div>
        </div>
      ) : gameState === 'playing' ? (
          <div className="absolute inset-0 z-0 bg-black">
             {/* HUD */}
             <div className="absolute inset-0 p-4 md:p-6 z-30 pointer-events-none">
                 {/* Top Left: Health & Transform Stack */}
                 <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col gap-2 pointer-events-auto w-48 sm:w-64 max-w-[50%]">
                     {/* Health Meter */}
                     <div className="flex gap-1">
                         {[...Array((selectedDino === 'velociraptor' ? 2 : 1) + (upgrades.maxHealth || 0))].map((_, i) => {
                             const idx = i + 1;
                             const hasHealth = idx <= health;
                             return (
                                 <div key={idx} className={`p-1.5 md:p-2 rounded-lg backdrop-blur-sm border-2 ${hasHealth ? 'bg-red-500/20 border-red-500/50' : 'bg-black/40 border-gray-800'}`}>
                                     <Heart className={`w-5 h-5 md:w-6 md:h-6 ${hasHealth ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-gray-700'}`} />
                                 </div>
                             )
                         })}
                     </div>
                     
                     {/* Defense Points (Shows only when robot) */}
                     {isRobot && (
                         <div className="flex gap-1 mt-1">
                             {[...Array(selectedDino === 'velociraptor' ? 2 : selectedDino === 'triceratops' ? 3 : 1)].map((_, i) => {
                                 const idx = i + 1;
                                 const hasShield = idx <= defensePoints;
                                 return (
                                     <div key={`shield-${idx}`} className={`p-1 md:p-1.5 rounded-lg flex items-center justify-center border-2 ${hasShield ? 'bg-cyan-500/20 border-cyan-400' : 'bg-black/40 border-gray-800'}`}>
                                        <div className={`w-4 h-4 md:w-5 md:h-5 rotate-45 transform ${hasShield ? 'bg-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-gray-700'}`} />
                                     </div>
                                 )
                             })}
                         </div>
                     )}
                 </div>

                 {/* Top Center: Distance */}
                 <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto z-20">
                    <div className="bg-black/60 border border-t-0 border-l-0 border-r-0 border-b-2 border-cyan-400 p-2 md:p-3 backdrop-blur-md rounded-b-lg flex flex-col items-center">
                        <p className="text-2xl md:text-3xl font-black italic tracking-tighter">{currentScore.toString().padStart(6, '0')}<span className="text-sm font-normal ml-1 text-gray-400">m</span></p>
                    </div>
                 </div>

                 {/* Top Right: Gold */}
                 <div className="absolute top-4 right-4 md:top-6 md:right-6 pointer-events-auto z-20">
                    <div className="bg-black/60 border border-t-0 border-l-0 border-r-0 border-b-2 border-yellow-500 p-2 md:p-3 backdrop-blur-md rounded-b-lg text-yellow-400 flex flex-col items-end">
                        <p className="text-2xl md:text-3xl font-black italic tracking-tighter flex items-center gap-2">
                            {currentCoins}
                            <Coins className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                        </p>
                    </div>
                 </div>

                 {/* Achievement Popup (Top Center) */}
                 {achievementPopup && (
                     <div className="absolute top-24 left-1/2 transform -translate-x-1/2 pointer-events-none z-50 animate-[slide-down_0.3s_ease-out]">
                        <div className="bg-cyan-900/90 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)] p-3 rounded flex items-center gap-3 backdrop-blur-sm">
                           <Trophy className="text-yellow-400 w-6 h-6 drop-shadow-md" />
                           <div className="flex flex-col">
                               <span className="text-[10px] text-cyan-200 font-bold uppercase tracking-widest">ACHIEVEMENT UNLOCKED</span>
                               <span className="text-white font-black italic transform -skew-x-12">{achievementPopup.title}</span>
                               <span className="text-[10px] text-gray-300 font-mono">{achievementPopup.desc}</span>
                           </div>
                        </div>
                     </div>
                 )}
                 
                 <style>{`
                    @keyframes slide-down {
                       from { opacity: 0; transform: translate(-50%, -20px); }
                       to { opacity: 1; transform: translate(-50%, 0); }
                    }
                 `}</style>
             </div>
             
             {/* Note: The Canvas captures all events, so we put it directly in the flow */}
             <div className="w-full h-full absolute inset-0 z-10">
                 <ThreeGame 
                    dinoType={selectedDino} 
                    onGameOver={() => handleGameOver(currentScore, currentCoins)}
                    onScoreUpdate={setCurrentScore}
                    onCoinCollected={() => setCurrentCoins(c => c + 1)}
                    onFuelUpdate={setCurrentFuel}
                    currentFuel={currentFuel}
                    activeTrail={activeTrail}
                    activeTransform={activeTransform}
                    onDamage={handleDamage}
                    forceRevertTrigger={forceRevertTrigger}
                    onRobotTransform={(state: boolean) => {
                        setRobotState(state);
                        if (state) setDefensePoints(selectedDino === 'velociraptor' ? 2 : selectedDino === 'triceratops' ? 3 : 1);
                    }}
                    onHealthGain={() => setHealth(h => Math.min((selectedDino === 'velociraptor' ? 2 : 1) + (upgrades.maxHealth || 0), h + 1))}
                    upgrades={upgrades}
                    achievements={achievements}
                 />
             </div>
          </div>
      ) : gameState === 'gameover' ? (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden font-mono text-white">
             {/* Retro synthwave grid background */}
             <div className="absolute inset-0 bg-black">
                 <div className="absolute bottom-0 w-full h-[60%] [perspective:800px] overflow-hidden">
                     <div className="absolute inset-x-[-50%] top-0 h-[200%] bg-transparent border-t-[3px] border-magenta-500 [background-image:linear-gradient(rgba(217,70,239,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.3)_1px,transparent_1px)] bg-[size:50px_50px] [transform:rotateX(75deg)_translateY(-50px)] [transform-origin:top_center] animate-[grid-move_2s_linear_infinite]" />
                 </div>
                 <div className="absolute inset-x-0 bottom-[60%] h-1 bg-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff]" />
                 <div className="absolute inset-x-0 bottom-[60%] h-32 bg-gradient-to-t from-[#ff00ff]/30 to-transparent" />
                 
                 {/* Stars */}
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#000_100%)] opacity-80" />
                 {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="absolute bg-white rounded-full" style={{
                       left: `${Math.random() * 100}%`,
                       top: `${Math.random() * 50}%`,
                       width: `${Math.random() * 3}px`,
                       height: `${Math.random() * 3}px`,
                       opacity: Math.random() * 0.8 + 0.2
                    }} />
                 ))}
             </div>
             
             {/* Top scores */}
             <div className="absolute top-8 w-full px-8 md:px-16 flex justify-between items-start text-xs sm:text-base md:text-xl font-bold tracking-widest drop-shadow-[2px_2px_0px_#000]">
                 <div className="text-red-500 flex flex-col items-center">
                    <span>1P</span>
                    <span className="text-white mt-1">{lastScore.toString().padStart(6, '0')}</span>
                 </div>
                 <div className="text-[#ff9900] flex flex-col items-center">
                    <span>HIGH SCORE</span>
                    <span className="text-white mt-1">{highScore.toString().padStart(10, '0')}</span>
                 </div>
                 <div className="text-blue-500 flex flex-col items-center">
                    <span>2P</span>
                    <span className="text-white mt-1">00</span>
                 </div>
             </div>
             
             {/* Center GAME OVER */}
             <div className="relative z-10 flex flex-col items-center justify-center mt-[-5vh]">
                 <div className="mb-8">
                     <h1 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-[#b794f4] to-[#4299e1] drop-shadow-[0_0_8px_#ffffff] text-center" style={{ fontFamily: 'sans-serif', WebkitTextStroke: '2px #ff0000', filter: 'drop-shadow(2px 4px 0px #000)' }}>
                        <span className="text-6xl md:text-8xl">R</span>OBODINO
                     </h1>
                 </div>

                 <div className="flex flex-col items-center mb-8 w-full">
                    <Leaderboard currentScore={Math.floor(lastScore)} onComplete={() => {}} />
                 </div>

                 <button 
                    onClick={() => startGame()}
                    className="text-white text-lg md:text-xl font-bold tracking-widest animate-[pulse_1s_ease-in-out_infinite] hover:text-cyan-400 cursor-pointer mt-4 drop-shadow-[2px_2px_0px_#000]"
                 >
                     CLICK HERE TO CONTINUE
                 </button>
                 <button 
                    onClick={() => {
                       audioEngine.stopLoop();
                       setGameState('menu');
                    }}
                    className="mt-6 text-gray-400 text-xs md:text-sm hover:text-white cursor-pointer px-4 py-2 border-2 border-gray-600 rounded bg-black/50 backdrop-blur"
                 >
                     RETURN TO MENU
                 </button>
             </div>
             
             {/* Bottom Credit */}
             <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 text-yellow-400 font-bold text-lg md:text-2xl tracking-widest drop-shadow-[2px_2px_0_#000]">
                 CREDIT <span className="text-white">{lastCoins}</span>
             </div>
          </div>
      ) : gameState === 'character_select' ? (
         <>
          {/* Main Background */}
          <div className="absolute inset-0 bg-[#060b13] overflow-hidden font-sans">
          </div>

          <div className="absolute inset-0 flex flex-col z-10 pointer-events-none">
              
              {/* Top Header */}
              <header className="pointer-events-auto relative flex justify-between items-center h-12 md:h-16 bg-[linear-gradient(90deg,#0e2644,#1b4571,#0e2644)] border-b border-[#2a68a5]">
                 <div className="flex items-center h-full">
                     <div className="w-12 md:w-16 h-full bg-[#f4a261] opacity-90" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0% 100%)' }} />
                     <h1 className="text-white text-lg md:text-2xl font-bold italic tracking-wider ml-4 drop-shadow-md pb-1">SELECT YOUR DINO</h1>
                 </div>
                 <div className="flex items-center space-x-2 mr-4 bg-[#0a192f] rounded-full pl-3 pr-1 py-1 border border-[#1b3a57] shadow-inner">
                     <Coins className="text-yellow-400 w-4 h-4 md:w-5 md:h-5" />
                     <span className="text-white font-bold text-sm md:text-base mr-2">{totalCoins}</span>
                     <button onClick={() => setShowAchievements(true)} className="bg-gradient-to-b from-[#06b6d4] to-[#0284c7] rounded-full p-1 cursor-pointer hover:brightness-110 text-white shadow-md border border-cyan-200">
                        <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                     </button>
                     <button onClick={() => setShowShop(true)} className="bg-gradient-to-b from-[#ffea00] to-[#f48c06] rounded-full p-1 cursor-pointer hover:brightness-110 text-black shadow-md border border-yellow-200">
                        <Store className="w-3 h-3 md:w-4 md:h-4" />
                     </button>
                 </div>
              </header>

              {/* The 3D Preview Most Background */}
              <div className="absolute inset-x-0 md:left-32 bottom-[100px] md:bottom-0 top-12 md:top-16 -z-10 bg-transparent flex justify-center items-center pointer-events-none">
                  <div className="w-full h-full">
                     <DinoPreview dinoType={selectedDino} isSelected={true} showStand={true} />
                  </div>
              </div>

              {/* Main Content Overlay */}
              <div className="flex-1 flex flex-col md:flex-row justify-between w-full h-full pb-20 md:pb-0 z-20">
                  
                  {/* Left Sidebar (Desktop/Tablet) */}
                  <div 
                     className="hidden md:flex pointer-events-auto w-24 md:w-32 bg-[linear-gradient(to_bottom,#1b4571,#0a192f)] border-r-2 border-[#2a68a5] h-full flex-row flex-1 max-w-[128px] items-center justify-center relative select-none"
                     onWheel={(e) => {
                         const allDinos = ['triceratops', 'velociraptor', 'trex', 'stegosaurus', 'brachiosaurus', 'pterodactyl'];
                         const activeIdx = allDinos.indexOf(selectedDino);
                         if (e.deltaY > 0) {
                            const nextIdx = (activeIdx + 1) % allDinos.length;
                            if (['triceratops', 'velociraptor', 'trex'].includes(allDinos[nextIdx])) setSelectedDino(allDinos[nextIdx] as DinoType);
                         } else if (e.deltaY < 0) {
                            const prevIdx = (activeIdx - 1 + allDinos.length) % allDinos.length;
                            if (['triceratops', 'velociraptor', 'trex'].includes(allDinos[prevIdx])) setSelectedDino(allDinos[prevIdx] as DinoType);
                         }
                     }}
                     onTouchStart={(e) => {
                         const touch = e.touches[0];
                         (e.currentTarget as any).startY = touch.clientY;
                     }}
                     onTouchEnd={(e) => {
                         const touch = e.changedTouches[0];
                         const startY = (e.currentTarget as any).startY;
                         if (startY !== undefined) {
                             const deltaY = startY - touch.clientY;
                             const allDinos = ['triceratops', 'velociraptor', 'trex', 'stegosaurus', 'brachiosaurus', 'pterodactyl'];
                             const activeIdx = allDinos.indexOf(selectedDino);
                             if (deltaY > 30) {
                                const nextIdx = (activeIdx + 1) % allDinos.length;
                                if (['triceratops', 'velociraptor', 'trex'].includes(allDinos[nextIdx])) setSelectedDino(allDinos[nextIdx] as DinoType);
                             } else if (deltaY < -30) {
                                const prevIdx = (activeIdx - 1 + allDinos.length) % allDinos.length;
                                if (['triceratops', 'velociraptor', 'trex'].includes(allDinos[prevIdx])) setSelectedDino(allDinos[prevIdx] as DinoType);
                             }
                         }
                     }}
                     style={{ touchAction: 'none' }}
                  >
                     {/* Items Column */}
                     <div className="flex flex-col flex-1 items-center space-y-8 z-10 w-full">
                         {(() => {
                            const allDinos = ['triceratops', 'velociraptor', 'trex', 'stegosaurus', 'brachiosaurus', 'pterodactyl'];
                            const activeIdx = allDinos.indexOf(selectedDino);
                            const prevIdx = (activeIdx - 1 + allDinos.length) % allDinos.length;
                            const nextIdx = (activeIdx + 1) % allDinos.length;
                            const visibleDinos = [allDinos[prevIdx], allDinos[activeIdx], allDinos[nextIdx]];
                            
                            return visibleDinos.map((type, idx) => {
                               const isSelected = idx === 1; // Middle one is always selected
                               const isAvailable = ['triceratops', 'velociraptor', 'trex'].includes(type);
                               return (
                                  <button 
                                    key={`${type}-${idx}`}
                                    onClick={() => { if (isAvailable) { setSelectedDino(type as DinoType); audioEngine.playSelectDino(); } }}
                                    onDoubleClick={() => { if (isAvailable) { setSelectedDino(type as DinoType); startGame(type as DinoType); } }}
                                    className={`relative flex flex-col items-center w-20 h-24 group ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                  >
                                      <div className={`relative w-16 h-16 md:w-16 md:h-16 flex items-center justify-center transform rotate-45 transition-all shadow-lg overflow-hidden ${isSelected ? 'bg-[linear-gradient(135deg,#0a192f,#1b4571)] shadow-[0_0_15px_rgba(255,234,0,0.5)] scale-110' : 'bg-[#0a192f] hover:bg-[#112240] scale-90 opacity-80'}`}>
                                         <div className={`absolute inset-0 z-20 pointer-events-none border-[3px] transition-colors ${isSelected ? 'border-[#ffea00]' : 'border-[#4a7a9a] group-hover:border-gray-300'}`} />
                                         <div className="transform -rotate-45 w-[140%] h-[140%] flex items-center justify-center relative pointer-events-none z-0">
                                             {isAvailable ? (
                                                <DinoPreview dinoType={type as DinoType} isSelected={isSelected} />
                                             ) : (
                                                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-gray-400">
                                                   {type.substring(0,3)}
                                                </span>
                                             )}
                                         </div>
                                      </div>
                                      
                                      <div className={`absolute -bottom-2 z-10 w-20 md:w-24 text-center text-[8px] md:text-[9px] font-black italic tracking-widest py-1 border shadow-md transform -skew-x-12 ${isSelected ? 'bg-gradient-to-r from-[#ffea00] to-[#f48c06] text-black border-yellow-200' : isAvailable ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white border-blue-400' : 'bg-gradient-to-r from-gray-600 to-gray-800 text-white border-gray-400'}`}>
                                         {isSelected ? 'SELECTED' : isAvailable ? 'SELECT' : 'COMING SOON'}
                                      </div>
                                  </button>
                               )
                            });
                         })()}
                     </div>
                     
                     {/* Dot Indicator Column */}
                     <div className="flex flex-col items-center space-y-3 absolute -right-6 md:-right-8 z-10 bg-black/40 py-4 px-2 rounded-full border border-[#1b4571]">
                        {['triceratops', 'velociraptor', 'trex', 'stegosaurus', 'brachiosaurus', 'pterodactyl'].map((type) => {
                           const isActive = selectedDino === type;
                           return (
                              <div 
                                 key={`dot-${type}`} 
                                 className={`rounded-full transition-all duration-300 ${isActive ? 'bg-[#ffea00] h-6 w-1.5 shadow-[0_0_8px_rgba(255,234,0,0.8)]' : 'bg-gray-500 h-1.5 w-1.5'}`} 
                              />
                           )
                        })}
                     </div>
                  </div>

                  {/* Center Content Overlay */}
                  <div className="pointer-events-none flex-1 relative flex flex-col items-center justify-start py-10 overflow-hidden">
                      {/* Name Plate */}
                      <h2 className="text-4xl md:text-5xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 transform -skew-x-12 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] uppercase">
                          {selectedDino}
                      </h2>

                      {/* Small Panel for Robot Transformation Model */}
                      <div className="absolute left-4 md:left-8 top-1/4 w-32 md:w-40 bg-[#0a192f]/80 flex flex-col pointer-events-auto rounded-lg overflow-hidden shadow-[0_0_15px_rgba(0,242,255,0.4)] border-2 border-[#00f2ff] backdrop-blur-md">
                          <button onClick={() => setShowMechaForm(!showMechaForm)} className="bg-[#00f2ff]/20 hover:bg-[#00f2ff]/30 text-[#00f2ff] text-[8px] md:text-[10px] font-black italic tracking-widest text-center py-1.5 border-b border-[#00f2ff] cursor-pointer cursor-auto transition-colors flex justify-center items-center">
                              MECHA FORM {showMechaForm ? '▼' : '►'}
                          </button>
                          {showMechaForm && (
                              <div className="h-40 md:h-48 relative border-t border-[#00f2ff]/50 cursor-grab active:cursor-grabbing">
                                  <DinoPreview dinoType={selectedDino} isSelected={true} isRobot={true} allowPan={true} />
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Right Sidebar (Specifications) */}
                  <div className="hidden lg:flex pointer-events-auto w-64 bg-transparent p-4 flex-col justify-start mt-8 z-20">
                     <div className="bg-[#0a192f]/70 border border-[#2a68a5] rounded-xl p-5 backdrop-blur-md relative shadow-[-5px_5px_15px_rgba(0,0,0,0.5)]">
                        <div className="absolute -top-3 -left-2 bg-[linear-gradient(90deg,#1b4571,#0e2644)] border border-[#4a7a9a] px-4 py-1 pb-1.5 shadow-md transform -skew-x-12">
                            <span className="text-white text-[10px] font-black italic tracking-widest uppercase transform skew-x-12 block">
                                SPECIFICATION
                            </span>
                        </div>
                        
                        <div className="mt-6 flex flex-col gap-5">
                           <StatBar label="SPEED" percentage={selectedDino === 'velociraptor' ? 95 : selectedDino === 'trex' ? 65 : 45} color="#00f2ff" />
                           <StatBar label="DEFENCE" percentage={selectedDino === 'triceratops' ? 90 : selectedDino === 'trex' ? 65 : 30} color="#00f2ff" />
                           <StatBar label="HEALTH" percentage={selectedDino === 'triceratops' ? 100 : selectedDino === 'trex' ? 85 : 50} color="#00f2ff" />
                           <StatBar label="SHOOTING (COMING SOON)" percentage={0} color="#00f2ff" />
                        </div>
                     </div>
                  </div>

              </div>

              {/* Mobile Carousel (Bottom) */}
              <div className="md:hidden pointer-events-auto absolute bottom-24 left-0 right-0 flex flex-col items-center gap-4 z-50">
                  <div className="flex overflow-x-auto gap-4 px-4 py-1 snap-x w-full" style={{ scrollbarWidth: 'none' }}>
                      {['triceratops', 'velociraptor', 'trex', 'stegosaurus', 'brachiosaurus', 'pterodactyl'].map((type) => {
                            const isSelected = selectedDino === type;
                            const isAvailable = ['triceratops', 'velociraptor', 'trex'].includes(type);
                            return (
                                <button
                                    key={`mob-${type}`}
                                    onClick={() => { if (isAvailable) { setSelectedDino(type as DinoType); audioEngine.playSelectDino(); } }}
                                    onDoubleClick={() => { if (isAvailable) { setSelectedDino(type as DinoType); startGame(type as DinoType); } }}
                                    className={`flex-shrink-0 snap-center w-24 h-32 relative bg-[#0a192f] rounded-lg flex flex-col items-center justify-center p-2 shadow-lg transition-transform ${isSelected ? 'scale-105 shadow-[0_0_15px_rgba(255,234,0,0.5)]' : isAvailable ? '' : 'opacity-60'}`}
                                >
                                    <div className={`absolute inset-0 z-20 pointer-events-none border-2 rounded-lg transition-colors ${isSelected ? 'border-[#ffea00]' : isAvailable ? 'border-[#4a7a9a]' : 'border-gray-800'}`} />
                                    <div className="w-full h-20 pointer-events-none relative z-0">
                                        {isAvailable ? (
                                            <DinoPreview dinoType={type as DinoType} isSelected={isSelected} />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 font-bold uppercase text-[10px]">COMING</div>
                                        )}
                                    </div>
                                    <span className={`relative z-10 text-[9px] font-black italic tracking-wider mt-1 ${isSelected ? 'text-[#ffea00]' : 'text-white'}`}>
                                        {type.substring(0, 10)}
                                    </span>
                                </button>
                            )
                      })}
                  </div>
                  {/* Dot Indicator Row */}
                  <div className="flex flex-row items-center justify-center space-x-3 bg-black/40 px-4 py-2 rounded-full border border-[#1b4571]">
                      {['triceratops', 'velociraptor', 'trex', 'stegosaurus', 'brachiosaurus', 'pterodactyl'].map((type) => {
                         const isActive = selectedDino === type;
                         return (
                            <div 
                               key={`dot-mob-${type}`} 
                               className={`rounded-full transition-all duration-300 ${isActive ? 'bg-[#ffea00] w-6 h-1.5 shadow-[0_0_8px_rgba(255,234,0,0.8)]' : 'bg-gray-500 w-1.5 h-1.5'}`} 
                            />
                         )
                      })}
                  </div>
              </div>
              
              {/* Bottom Buttons */}
              <div className="absolute bottom-4 md:bottom-8 left-4 md:left-[140px] right-4 md:right-8 flex justify-between items-end z-30 pointer-events-none">
                  
                  {/* Discord Button */}
                  <button className="pointer-events-auto bg-gradient-to-r from-[#5865F2] to-[#4752C4] border border-[#7289DA] text-white flex items-center pl-10 pr-4 py-2 md:py-3 rounded-[20px] rounded-bl-sm shadow-[0_5px_15px_rgba(88,101,242,0.4)] relative transform transition-transform hover:scale-105 active:scale-95 group">
                     <div className="absolute -left-4 -top-6 md:-top-4 bg-gradient-to-br from-[#2b2d42] to-[#121420] rounded-lg border-2 border-gray-400 p-2 shadow-lg transform -rotate-12 group-hover:rotate-0 transition-transform">
                        <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                     </div>
                     <div className="flex flex-col items-start ml-2 w-max">
                        <span className="text-[7px] md:text-[9px] text-[#ffffff] font-bold leading-tight uppercase">Join community</span>
                        <span className="text-[7px] md:text-[9px] text-[#ffffff] font-bold leading-tight uppercase">To get updates</span>
                     </div>
                     <div className="ml-3 font-black tracking-wider text-xs md:text-sm shadow-black drop-shadow-md">JOIN DISCORD</div>
                  </button>

                  {/* Start Button */}
                  <button 
                     onClick={() => startGame()}
                     className="pointer-events-auto bg-gradient-to-b from-[#ffea00] via-[#ffba08] to-[#f48c06] text-[#370617] font-black italic text-xl md:text-3xl px-8 md:px-16 py-3 md:py-4 rounded-xl border border-yellow-200 shadow-[0_5px_20px_rgba(244,140,6,0.5)] cursor-pointer hover:brightness-110 active:translate-y-1 transform transition-all"
                  >
                     <span className="drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">START</span>
                  </button>
              </div>
          </div>
          
          {showShop && (
             <Shop 
                totalCoins={totalCoins} 
                onPurchase={handlePurchase} 
                onClose={() => setShowShop(false)} 
                unlockedItems={unlockedItems}
                activeTrail={activeTrail}
                activeTransform={activeTransform}
                onEquip={handleEquip}
                upgrades={upgrades}
                onPurchaseUpgrade={(cost, upgradeId) => {
                    setTotalCoins(prev => {
                        const newCoins = prev - cost;
                        localStorage.setItem('robodino-coins', newCoins.toString());
                        return newCoins;
                    });
                    setUpgrades(prev => {
                        const isBooleanUpgrade = upgradeId === 'doubleJump' || upgradeId === 'magnetize';
                        const newUpgrades = { ...prev, [upgradeId]: isBooleanUpgrade ? true : ((prev[upgradeId as keyof typeof prev] as number) || 0) + 1 };
                        localStorage.setItem('robodino-upgrades', JSON.stringify(newUpgrades));
                        return newUpgrades;
                    });
                }}
             />
          )}

          {showAchievements && (
             <Achievements 
                stats={achievements}
                onClose={() => setShowAchievements(false)}
             />
          )}
         </>
      ) : null}
    </div>
  );
}
