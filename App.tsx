import React, { useState, useRef, useEffect } from 'react';
import { generateAnimalCard, generateRandomBoss } from './services/geminiService';
import { playSfx } from './services/audioService';
import { AnimalData, LoadingState, Player, GamePhase, Move, SavedAnimal } from './types';
import { BattleCard } from './components/BattleCard';
import { Spinner } from './components/Spinner';
import { GameLog } from './components/GameLog';
import { HealthBar } from './components/HealthBar';
import { MoveDetailModal } from './components/MoveDetailModal';
import { AboutModal } from './components/AboutModal';
import { GalleryModal } from './components/GalleryModal';
import { ShareModal } from './components/ShareModal';

// --- GAME LOGIC CONSTANTS ---

// Type Effectiveness Chart (Attacker -> Defender)
const TYPE_CHART: Record<string, string[]> = {
    '烈焰': ['森罗', '冰霜', '虫'],
    '潮汐': ['烈焰', '大地', '岩石'],
    '森罗': ['潮汐', '大地', '雷霆'],
    '雷霆': ['潮汐', '飞行'],
    '冰霜': ['森罗', '大地', '龙', '飞行'],
    '格斗': ['一般', '岩石', '冰霜', '暗影'],
    '大地': ['烈焰', '雷霆', '毒', '岩石'],
    '疾风': ['森罗', '格斗', '虫'],
    '灵能': ['格斗', '毒'],
    '暗影': ['灵能', '幽灵'],
    '妖精': ['格斗', '龙', '暗影']
};

const getMoveImageUrl = (move: Move) => {
    return `https://image.pollinations.ai/prompt/cute cartoon rpg skill effect, ${encodeURIComponent(move.visual_prompt)}?width=400&height=300&nologo=true&seed=${move.power}&model=flux`;
};

// Helper to calculate damage with Type Effectiveness
const calculateDamage = (move: Move, attackerData: AnimalData, defenderData: AnimalData) => {
    // 1. Base Damage
    const ratio = attackerData.stats.attack / defenderData.stats.defense; 
    const random = 0.85 + Math.random() * 0.3;
    let multiplier = 1.0;
    
    // 2. Type Effectiveness Logic
    const atkType = attackerData.element;
    const defType = defenderData.element;
    
    let effectiveness = 'normal'; // normal, super, not_effective

    if (TYPE_CHART[atkType]?.includes(defType)) {
        multiplier *= 1.5;
        effectiveness = 'super';
    } else if (TYPE_CHART[defType]?.includes(atkType)) {
        multiplier *= 0.6;
        effectiveness = 'not_effective';
    }

    // 3. Crit Logic
    let isCrit = false;
    if (Math.random() < 0.15) { 
        multiplier *= 1.5;
        isCrit = true;
    }
    
    // Scale damage for Player HP (approx 300 max for demo)
    let damage = Math.floor((move.power * ratio * 1.2 + 25) * random * multiplier);
    return { damage: Math.max(1, damage), isCrit, effectiveness };
};

// --- DECORATION COMPONENTS FOR HOME PAGE ---
const Cloud = ({ className, delay = '0s' }: { className: string, delay?: string }) => (
    <div className={`absolute text-white opacity-80 animate-float-damage pointer-events-none ${className}`} style={{ animationDuration: '20s', animationDelay: delay }}>
        <svg width="100" height="60" viewBox="0 0 100 60" fill="currentColor">
             <path d="M25,50 A15,15 0 0,1 25,20 A20,20 0 0,1 55,15 A20,20 0 0,1 80,30 A15,15 0 0,1 80,50 Z" />
        </svg>
    </div>
);

const Hill = ({ color, className }: { color: string, className: string }) => (
    <div className={`absolute rounded-[100%] ${color} ${className}`}></div>
);

const Tree = ({ className }: { className: string }) => (
    <div className={`absolute flex flex-col items-center pointer-events-none z-10 ${className}`}>
        <div className="w-20 h-20 bg-[#66bb6a] rounded-full shadow-sm relative z-10 border-b-4 border-[#388e3c]">
            <div className="absolute top-2 left-4 w-4 h-4 bg-[#a5d6a7] rounded-full opacity-50"></div>
        </div>
        <div className="w-4 h-8 bg-[#795548] -mt-2 rounded-sm border-r-2 border-[#4e342e]"></div>
    </div>
);

const Flower = ({ className, color = 'bg-white' }: { className: string, color?: string }) => (
    <div className={`absolute flex items-center justify-center w-6 h-6 animate-pulse z-10 ${className}`}>
        <div className={`w-full h-full rounded-full ${color} shadow-sm relative`}>
            <div className="absolute inset-0 m-auto w-2 h-2 bg-yellow-400 rounded-full"></div>
        </div>
        <div className="absolute w-1 h-3 bg-green-500 top-full"></div>
    </div>
);

const FallingIcons = () => {
    const [drops, setDrops] = useState<{id: number, left: number, delay: number, icon: string}[]>([]);
  
    useEffect(() => {
      const icons = ['🦴', '🐾', '🌸', '🍃', '⭐', '🍄', '🍬', '✨'];
      const newDrops = Array.from({length: 20}).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8, // spread out start times
        icon: icons[Math.floor(Math.random() * icons.length)]
      }));
      setDrops(newDrops);
    }, []);
  
    return (
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {drops.map(d => (
          <div 
            key={d.id}
            className="absolute -top-12 animate-fall text-3xl md:text-5xl opacity-80 drop-shadow-md filter hover:brightness-110"
            style={{
              left: `${d.left}%`,
              animationDuration: `${6 + Math.random() * 4}s`,
              animationDelay: `${d.delay}s`
            }}
          >
            {d.icon}
          </div>
        ))}
      </div>
    )
};

// Define Card State to include base64 for saving
type CardState = { data: AnimalData; imageUrl: string; base64: string } | null;

// Initial HP reduced for quicker demos (2-3 rounds)
const INITIAL_HP = 300;

const App: React.FC = () => {
  // Game Flow State
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [gameMode, setGameMode] = useState<'pvp' | 'pve'>('pvp');
  const [round, setRound] = useState<number>(1);
  const [logs, setLogs] = useState<string[]>([]);
  const [showAbout, setShowAbout] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  // Gallery target state (which player is selecting from gallery). 0 = View Only (Main Menu)
  const [galleryTargetId, setGalleryTargetId] = useState<number>(0);

  // Players
  const [player1, setPlayer1] = useState<Player>({ id: 1, label: 'PLAYER 01', currentHp: INITIAL_HP, maxHp: INITIAL_HP });
  const [player2, setPlayer2] = useState<Player>({ id: 2, label: 'PLAYER 02', currentHp: INITIAL_HP, maxHp: INITIAL_HP });

  // Cards - Added base64 storage
  const [p1Card, setP1Card] = useState<CardState>(null);
  const [p2Card, setP2Card] = useState<CardState>(null);
  
  // Turn State
  const [activePlayerId, setActivePlayerId] = useState<number>(0);
  const [actionsTaken, setActionsTaken] = useState<number[]>([]); 

  // Animation States
  const [animatingHurtId, setAnimatingHurtId] = useState<number | null>(null);
  const [damageOverlay, setDamageOverlay] = useState<{targetId: number, text: string, type: 'crit'|'normal'|'miss'} | null>(null);

  // Modal State
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);

  // Loading States
  const [p1Loading, setP1Loading] = useState<LoadingState>('idle');
  const [p2Loading, setP2Loading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  const p1FileInputRef = useRef<HTMLInputElement>(null);
  const p2FileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
  };

  const startGame = (mode: 'pvp' | 'pve') => {
    playSfx('select');
    setGameMode(mode);
    setPlayer1({ id: 1, label: 'PLAYER 01', currentHp: INITIAL_HP, maxHp: INITIAL_HP });
    setPlayer2({ id: 2, label: 'PLAYER 02', currentHp: INITIAL_HP, maxHp: INITIAL_HP });
    setRound(1);
    setLogs(['SYSTEM: 欢迎来到萌兽农场！', 'MISSION: 请选择你的动物伙伴开始对战！']);
    resetRound();
    setPhase('upload');
  };

  const quitGame = () => {
    playSfx('cancel');
    setPhase('setup');
    setPlayer1({ id: 1, label: 'PLAYER 01', currentHp: INITIAL_HP, maxHp: INITIAL_HP });
    setPlayer2({ id: 2, label: 'PLAYER 02', currentHp: INITIAL_HP, maxHp: INITIAL_HP });
    setRound(1);
    setLogs([]);
    resetRound();
  };

  const restartGame = () => {
      startGame(gameMode);
  };

  const resetRound = () => {
    setP1Card(null);
    setP2Card(null);
    setP1Loading('idle');
    setP2Loading('idle');
    setActionsTaken([]);
    setActivePlayerId(0);
    setSelectedMove(null);
    setAnimatingHurtId(null);
    setDamageOverlay(null);
    setShowShare(false);
    if (p1FileInputRef.current) p1FileInputRef.current.value = '';
    if (p2FileInputRef.current) p2FileInputRef.current.value = '';
  };

  // Generate Random Boss for P2
  const handleGenerateBoss = async () => {
      // Don't play select sfx here if auto-triggered, but okay for manual call if we had one
      setP2Loading('generating');
      try {
          const data = await generateRandomBoss();
          
          // Improved Prompt Logic:
          const prompt = `cute cartoon rpg character, powerful ${data.species} boss, ${data.element} element theme, epic stance, fantasy art style`;
          const bossImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=300&height=300&nologo=true&seed=${Math.random()}&model=flux`;

          // Boss image is remote, we don't save boss to local gallery usually, so base64 can be placeholder or empty for boss
          // Boss HP set to 500 for faster demo (vs 300 player)
          setP2Card({ data, imageUrl: bossImageUrl, base64: '' });
          setPlayer2(prev => ({...prev, label: "WILD BOSS", maxHp: 500, currentHp: 500})); 
          setP2Loading('complete');
          playSfx('start'); // Notify when boss is ready
      } catch (err) {
          console.error(err);
          setP2Loading('error');
      }
  };

  // Auto trigger boss in PvE mode
  useEffect(() => {
    if (phase === 'upload' && gameMode === 'pve' && !p2Card && p2Loading === 'idle') {
        handleGenerateBoss();
    }
  }, [phase, gameMode, p2Card, p2Loading]);

  // Handle Image Upload
  const handleUpload = async (file: File, playerId: number) => {
    playSfx('select');
    const setLoading = playerId === 1 ? setP1Loading : setP2Loading;
    const setCard = playerId === 1 ? setP1Card : setP2Card;
    
    setLoading('analyzing');
    setError(null);

    try {
        const objectUrl = URL.createObjectURL(file);
        const base64String = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        setLoading('generating');
        const data = await generateAnimalCard(base64String, file.type);
        
        // Preload move images
        data.moves.forEach(move => {
            const img = new Image();
            img.src = getMoveImageUrl(move);
        });

        // Store base64 for saving later
        setCard({ data, imageUrl: objectUrl, base64: base64String });
        playSfx('start');
        setLoading('complete');

    } catch (err) {
        console.error(err);
        setLoading('error');
        playSfx('miss');
        setError(`玩家 ${playerId} 上传失败，请重试`);
    }
  };

  // Gallery Logic
  const handleOpenGallery = (playerId: number) => {
      playSfx('select');
      setGalleryTargetId(playerId);
      setShowGallery(true);
  };

  const handleSelectFromGallery = (item: SavedAnimal) => {
      // Logic for selecting (Gallery Modal now handles the confirmation UI)
      // This is called when user confirms selection in Gallery
      const setCard = galleryTargetId === 1 ? setP1Card : setP2Card;
      const setLoading = galleryTargetId === 1 ? setP1Loading : setP2Loading;

      setCard({
          data: item.data,
          imageUrl: `data:image/png;base64,${item.imageBase64}`,
          base64: item.imageBase64
      });
      setLoading('complete');
      setShowGallery(false);
      playSfx('start');
  };

  const handleSaveToGallery = (card: CardState) => {
      if (!card || !card.base64) return;
      
      try {
          const savedStr = localStorage.getItem('beast_battler_gallery');
          const saved: SavedAnimal[] = savedStr ? JSON.parse(savedStr) : [];
          
          if (saved.length >= 10) {
              alert("图鉴已满（10/10），请先删除一些旧的萌兽！");
              return;
          }
          
          // Avoid duplicates
          const alreadySaved = saved.some(s => s.data.title === card.data.title && s.data.species === card.data.species);
          if (alreadySaved) {
              alert("这个萌兽已经在图鉴里啦！");
              return;
          }

          const newItem: SavedAnimal = {
              id: Date.now().toString(),
              data: card.data,
              imageBase64: card.base64,
              createdAt: Date.now()
          };

          localStorage.setItem('beast_battler_gallery', JSON.stringify([...saved, newItem]));
          playSfx('win'); // Little victory sound for saving
      } catch (e) {
          console.error(e);
          alert("保存失败，图片可能太大！");
      }
  };


  useEffect(() => {
    if (phase === 'upload' && p1Card && p2Card) {
        startCombatPhase();
    }
  }, [p1Card, p2Card, phase]);

  const startCombatPhase = () => {
    if (!p1Card || !p2Card) return;

    setPhase('battle_turn');
    playSfx('start');
    addLog(`--- 第 ${round} 回合开始！ ---`);
    
    if (p1Card.data.stats.speed >= p2Card.data.stats.speed) {
        setActivePlayerId(1);
        addLog(`>> ${p1Card.data.title} (P1) 动作敏捷，先攻！`);
    } else {
        setActivePlayerId(2);
        addLog(`>> ${p2Card.data.title} (P2) 动作敏捷，先攻！`);
    }
  };

  const handleMoveSelect = (move: Move) => {
    if (phase !== 'battle_turn') return;
    playSfx('select');
    setSelectedMove(move);
  };

  const executeMove = () => {
    const move = selectedMove;
    setSelectedMove(null);

    if (!move || phase !== 'battle_turn') return;

    const attackerId = activePlayerId;
    const defenderId = attackerId === 1 ? 2 : 1;
    const attackerCard = attackerId === 1 ? p1Card : p2Card;
    const defenderCard = attackerId === 1 ? p2Card : p1Card;
    const defenderPlayer = attackerId === 1 ? player2 : player1;
    const setDefenderPlayer = attackerId === 1 ? setPlayer2 : setPlayer1;

    if (!attackerCard || !defenderCard) return;

    if (Math.random() * 100 > move.accuracy) {
        addLog(`[MISS] (P${attackerId}) ${attackerCard.data.title} 打空了！哎呀！`);
        playSfx('miss');
        setDamageOverlay({ targetId: defenderId, text: 'MISS', type: 'miss' });
        setTimeout(() => setDamageOverlay(null), 1000);
    } else {
        const { damage, isCrit, effectiveness } = calculateDamage(move, attackerCard.data, defenderCard.data);
        const newHp = Math.max(0, defenderPlayer.currentHp - damage);
        
        if (isCrit) playSfx('crit');
        else playSfx('hit');

        setAnimatingHurtId(defenderId);
        setDamageOverlay({ 
            targetId: defenderId, 
            text: `-${damage}`, 
            type: isCrit ? 'crit' : 'normal' 
        });

        setTimeout(() => {
            setAnimatingHurtId(null);
            setDamageOverlay(null);
        }, 800);
        
        setDefenderPlayer(prev => ({ ...prev, currentHp: newHp }));
        
        let effectMsg = '';
        if (effectiveness === 'super') effectMsg = '效果拔群! 🔥';
        if (effectiveness === 'not_effective') effectMsg = '收效甚微... 🛡️';
        
        addLog(`(P${attackerId}) ${move.name} ${isCrit ? '💥暴击! ' : ''}${effectMsg} >> ${damage}伤害`);

        if (newHp <= 0) {
            setPhase('gameover');
            setTimeout(() => playSfx('win'), 500);
            addLog(`*** 玩家 ${attackerId} 胜利！好耶！ ***`);
            return;
        }
    }

    const newActions = [...actionsTaken, attackerId];
    setActionsTaken(newActions);

    if (newActions.length >= 2) {
        setTimeout(() => {
            endRound();
        }, 2000);
    } else {
        setTimeout(() => {
             setActivePlayerId(defenderId);
             playSfx('switch');
        }, 1200);
    }
  };

  const endRound = () => {
    setRound(prev => prev + 1);
    addLog(`--- 第 ${round} 回合结束。准备下一轮！ ---`);
    playSfx('switch');
    resetRound();
    setPhase('upload');
  };

  const renderUploadSlot = (playerId: number) => {
    const loading = playerId === 1 ? p1Loading : p2Loading;
    const card = playerId === 1 ? p1Card : p2Card;
    const ref = playerId === 1 ? p1FileInputRef : p2FileInputRef;
    
    if (card) {
        // Updated: Pass onSave to BattleCard instead of rendering a separate button
        const canSave = (playerId === 1 || gameMode === 'pvp') && card.base64;
        
        return (
            <div className="relative w-full max-w-xs transform hover:-rotate-2 transition-all duration-500 hover:scale-105 cursor-pointer group">
                 <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 bg-green-500 text-white px-3 py-1 rounded-full border-2 border-white shadow-md font-bold text-xs animate-bounce">
                    {playerId === 2 && card.data.species.includes('领主') ? 'BOSS 降临!' : '准备就绪!'}
                </div>
                
                <BattleCard 
                    data={card.data} 
                    imageUrl={card.imageUrl} 
                    onSave={canSave ? () => handleSaveToGallery(card) : undefined}
                />
            </div>
        );
    }

    if (loading === 'analyzing' || loading === 'generating') {
        return (
            <div className="w-full h-72 bg-white/50 border-4 border-dashed border-amber-300 rounded-3xl flex items-center justify-center relative overflow-hidden">
                <Spinner label={loading === 'analyzing' ? '正在观察...' : '正在构思角色...'} />
            </div>
        );
    }

    // PvP Mode: Both see upload. PvE Mode: P2 sees nothing (auto-generating) or Error.
    if (playerId === 2 && gameMode === 'pve') {
        return (
            <div className="w-full h-72 bg-white/20 border-4 border-dashed border-amber-300/50 rounded-3xl flex items-center justify-center">
                 <p className="text-amber-700/50 font-bold animate-pulse">
                     {error ? 'BOSS 生成失败 (刷新重试)' : '正在召唤野生 BOSS...'}
                 </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xs flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center w-full h-72 bg-white/60 border-4 border-dashed border-amber-300 rounded-3xl transition-all group relative overflow-hidden">
                <div className="flex flex-col items-center justify-center p-4 text-center z-10 space-y-3">
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-sm">
                        <span className="text-4xl">📸</span>
                    </div>
                    <div>
                        <p className="font-cute text-amber-800 text-xl font-black">
                            {playerId === 1 ? '上传你的勇士' : '上传对手'}
                        </p>
                        
                        <div className="flex flex-col gap-2 mt-3">
                             {/* Upload Button */}
                             <label className="cursor-pointer bg-amber-400 hover:bg-amber-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors border-b-4 border-amber-600 active:border-b-0 active:mt-2">
                                点击上传图片
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    ref={ref}
                                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], playerId)}
                                />
                             </label>

                             {/* Gallery Button */}
                             <button 
                                onClick={() => handleOpenGallery(playerId)}
                                className="bg-white hover:bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors border border-amber-200"
                             >
                                📖 从图鉴选择
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  // --- RENDER START PAGE ---
  if (phase === 'setup') {
      return (
        <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-green-100">
            {/* Falling Icons Animation */}
            <FallingIcons />
            
            {/* --- RURAL BACKGROUND LAYERS --- */}
            
            {/* Sky Elements */}
            <div className="absolute top-10 left-10 opacity-60"><Cloud className="scale-150" delay="0s" /></div>
            <div className="absolute top-24 right-20 opacity-40"><Cloud className="scale-100" delay="5s" /></div>
            <div className="absolute top-60 left-1/4 opacity-30"><Cloud className="scale-75" delay="12s" /></div>

            {/* Rolling Hills - Furthest */}
            <Hill color="bg-[#a5d6a7]" className="w-[150%] h-[500px] -bottom-32 -left-20" />
            
            {/* Rolling Hills - Mid */}
            <Hill color="bg-[#81c784]" className="w-[120%] h-[400px] -bottom-40 -right-20" />

            {/* Rolling Hills - Closest */}
            <Hill color="bg-[#66bb6a]" className="w-[150%] h-[200px] -bottom-24 left-1/2 -translate-x-1/2" />

            {/* Decorations on hills */}
            <Tree className="bottom-48 left-10 scale-75" />
            <Tree className="bottom-40 right-20 scale-90" />
            <Tree className="bottom-52 right-1/4 scale-50 opacity-80" />
            
            <Flower className="bottom-32 left-32" />
            <Flower className="bottom-24 right-40 text-pink-200" color="bg-pink-100" />
            
            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center space-y-10">
                
                {/* TITLE - Updated for Sharpness & Cute Style */}
                <div className="text-center flex flex-col items-center gap-1 cursor-default relative">
                     {/* Sparkles */}
                     <div className="absolute -top-8 -left-8 text-4xl animate-bounce-slow delay-0 filter drop-shadow-sm">✨</div>
                     <div className="absolute top-12 -right-12 text-4xl animate-bounce-slow delay-100 filter drop-shadow-sm">✨</div>

                     <h2 className="text-5xl md:text-7xl font-black text-yellow-100 font-cute tracking-widest transform -rotate-3"
                         style={{ 
                            WebkitTextStroke: '2px #8d6e63',
                            textShadow: '3px 3px 0px #8d6e63'
                         }}>
                        舒舒服服
                     </h2>
                     <h1 className="text-8xl md:text-[9rem] font-black text-white font-cute leading-none tracking-wide animate-wiggle transform rotate-2"
                         style={{ 
                            WebkitTextStroke: '5px #5d4037', // Darker brown outline
                            textShadow: '6px 6px 0px #3e2723, 0px 8px 15px rgba(0,0,0,0.15)', // Hard 3D shadow + soft shadow
                         }}>
                        萌兽大乱斗
                     </h1>
                </div>

                {/* Fence/Wood Separator (Visual) */}
                <div className="w-80 h-5 bg-[#8d6e63] rounded-full shadow-lg flex items-center justify-around px-4 border-b-4 border-[#5d4037]">
                    <div className="w-3 h-8 bg-[#6d4c41] rounded-full border border-[#5d4037]"></div>
                    <div className="w-3 h-8 bg-[#6d4c41] rounded-full border border-[#5d4037]"></div>
                    <div className="w-3 h-8 bg-[#6d4c41] rounded-full border border-[#5d4037]"></div>
                    <div className="w-3 h-8 bg-[#6d4c41] rounded-full border border-[#5d4037]"></div>
                    <div className="w-3 h-8 bg-[#6d4c41] rounded-full border border-[#5d4037]"></div>
                </div>

                {/* Buttons Container */}
                <div className="flex flex-col gap-5 w-72">
                    <button 
                        onClick={() => startGame('pvp')}
                        className="w-full py-4 bg-[#8d6e63] hover:bg-[#795548] text-[#fffbef] text-2xl font-black font-cute rounded-2xl border-4 border-[#5d4037] shadow-[0_6px_0_#4e342e] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center gap-3 group"
                    >
                        <span className="group-hover:scale-125 transition-transform">⚔️</span> 双人对战
                    </button>
                    
                    <button 
                        onClick={() => startGame('pve')}
                        className="w-full py-4 bg-[#a1887f] hover:bg-[#8d6e63] text-[#fffbef] text-2xl font-black font-cute rounded-2xl border-4 border-[#6d4c41] shadow-[0_6px_0_#5d4037] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center gap-3 group"
                    >
                         <span className="group-hover:scale-125 transition-transform">🤖</span> 人机对战
                    </button>

                    <button 
                        onClick={() => handleOpenGallery(0)}
                        className="w-full py-4 bg-[#d4a373] hover:bg-[#e3b98e] text-white text-2xl font-black font-cute rounded-2xl border-4 border-[#a97142] shadow-[0_6px_0_#8a5a32] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center gap-3 group"
                    >
                         <span className="group-hover:scale-125 transition-transform">📖</span> 我的图鉴
                    </button>

                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-[#bcaaa4] hover:bg-[#a1887f] text-[#fffbef] text-2xl font-black font-cute rounded-2xl border-4 border-[#8d6e63] shadow-[0_6px_0_#795548] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center gap-3"
                    >
                         <span>🍃</span> 退出游戏
                    </button>
                </div>
            </div>

            {/* Bottom Buttons */}
            <div className="absolute bottom-6 left-6 z-20">
                <button 
                    onClick={() => setShowAbout(true)}
                    className="px-6 py-2 bg-[#8d6e63] hover:bg-[#795548] text-white font-bold rounded-xl border-b-4 border-[#5d4037] active:border-b-0 active:mt-1 shadow-md font-cute text-lg"
                >
                    关于我们
                </button>
            </div>
            
            <div className="absolute bottom-6 right-6 z-20">
                 <div className="px-4 py-2 bg-[#ffffff]/60 backdrop-blur-sm rounded-full text-[#5d4037] font-bold font-cute text-lg shadow-sm border border-white">
                    简体中文
                 </div>
            </div>

            <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
            
            <GalleryModal 
                isOpen={showGallery} 
                onClose={() => setShowGallery(false)} 
                onSelect={handleSelectFromGallery} 
            />
        </div>
      );
  }

  // --- RENDER BATTLE PAGE ---
  return (
    <div className="min-h-screen relative flex flex-col items-center p-4 overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-green-100">
      {/* BACKGROUND LAYERS (Z-0) */}
      <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-10 left-10 opacity-60"><Cloud className="scale-150" delay="0s" /></div>
            <div className="absolute top-24 right-20 opacity-40"><Cloud className="scale-100" delay="5s" /></div>
            <div className="absolute top-60 left-1/4 opacity-30"><Cloud className="scale-75" delay="12s" /></div>

            {/* Hills - Slightly lowered or adjusted for battle view */}
            <Hill color="bg-[#a5d6a7]" className="w-[150%] h-[500px] -bottom-32 -left-20" />
            <Hill color="bg-[#81c784]" className="w-[120%] h-[400px] -bottom-40 -right-20" />
            <Hill color="bg-[#66bb6a]" className="w-[150%] h-[200px] -bottom-24 left-1/2 -translate-x-1/2" />

            <Tree className="bottom-48 left-10 scale-75" />
            <Tree className="bottom-40 right-20 scale-90" />
            <Tree className="bottom-52 right-1/4 scale-50 opacity-80" />
            
            <Flower className="bottom-32 left-32" />
            <Flower className="bottom-24 right-40 text-pink-200" color="bg-pink-100" />
      </div>

      {/* Game Header */}
      <header className="w-full max-w-6xl flex justify-between items-center bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border-2 border-white mb-8 z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-400 rounded-xl flex items-center justify-center shadow-sm transform -rotate-6">
                <span className="text-2xl">🦁</span>
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-black font-cute text-amber-700 tracking-wide">
                    萌兽大乱斗
                </h1>
            </div>
        </div>
        
        <div className="flex gap-4">
            <button 
                onClick={quitGame}
                className="px-4 py-2 bg-red-100 text-red-500 font-bold rounded-xl hover:bg-red-200 transition-colors border-b-4 border-red-200 active:border-b-0 active:mt-1"
            >
                返回主菜单
            </button>
            
            {phase === 'gameover' && (
                <button 
                    onClick={restartGame}
                    className="px-6 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400 transition-all border-b-4 border-green-700 active:border-b-0 active:mt-1 shadow-md"
                >
                    再来一局
                </button>
            )}
        </div>
      </header>

      {/* Battle Status HUD */}
      <div className="w-full max-w-5xl grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-12 mb-8 sticky top-4 z-40">
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border-4 border-white transform rotate-1">
                <HealthBar current={player1.currentHp} max={player1.maxHp} />
            </div>
            
            <div className="flex flex-col items-center justify-center">
                <div className="bg-amber-400 text-white font-black text-xl px-4 py-2 rounded-full shadow-md border-4 border-amber-200">
                    R-{round}
                </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border-4 border-white transform -rotate-1">
                <HealthBar current={player2.currentHp} max={player2.maxHp} isRightSide={true} />
            </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 items-start justify-center flex-1 px-4 z-10">
            
            {/* Player 1 Zone */}
            <div className="flex-1 w-full flex flex-col items-center space-y-4 order-2 lg:order-1">
                <div className="w-full max-w-md flex justify-center">
                    {phase === 'upload' ? (
                        renderUploadSlot(1)
                    ) : (
                        p1Card && (
                            <div className="w-full animate-in slide-in-from-left-20 duration-700">
                                 <BattleCard 
                                    data={p1Card.data} 
                                    imageUrl={p1Card.imageUrl} 
                                    isBattleMode={true}
                                    isActive={activePlayerId === 1 && phase === 'battle_turn'}
                                    hasActed={actionsTaken.includes(1)}
                                    onMoveSelect={handleMoveSelect}
                                    isHurt={animatingHurtId === 1}
                                    damageEffect={damageOverlay?.targetId === 1 ? damageOverlay : null}
                                    onSave={(gameMode === 'pvp' || activePlayerId === 1) && p1Card.base64 ? () => handleSaveToGallery(p1Card) : undefined}
                                />
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Center HUD / Logs */}
            <div className="w-full lg:w-96 flex flex-col space-y-6 order-1 lg:order-2 shrink-0">
                {phase === 'battle_turn' && (
                    <div className="relative text-center py-4">
                         <div className="text-5xl font-black text-orange-500 drop-shadow-md font-cute transform -rotate-3">
                            VS
                         </div>
                         <div className={`mt-2 text-sm font-bold px-4 py-1 rounded-full inline-block shadow-sm transition-colors duration-500 ${activePlayerId === 1 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                            {activePlayerId === 1 ? '👈 P1 请出招' : 'P2 请出招 👉'}
                         </div>
                    </div>
                )}

                {phase === 'gameover' && (
                    <div className="flex flex-col gap-3">
                        <div className="text-center p-6 bg-white border-4 border-yellow-400 rounded-3xl shadow-xl animate-in zoom-in duration-300 transform rotate-1">
                            <div className="text-6xl mb-2">🏆</div>
                            <h2 className="text-3xl font-black text-yellow-500 mb-2 font-cute">比赛结束!</h2>
                            <p className="text-amber-800 font-bold text-xl">
                                获胜者: {player1.currentHp > 0 ? '玩家 01' : '玩家 02'}
                            </p>
                        </div>
                        
                        <button 
                            onClick={() => setShowShare(true)}
                            className="w-full py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl shadow-md border-b-4 border-blue-700 active:border-b-0 active:mt-1 animate-pulse"
                        >
                            📸 生成炫耀海报
                        </button>
                    </div>
                )}
                
                <GameLog logs={logs} />
                
                {error && (
                    <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 text-red-600 text-sm font-bold text-center shadow-md">
                        哎呀: {error}
                    </div>
                )}
            </div>

            {/* Player 2 Zone */}
            <div className="flex-1 w-full flex flex-col items-center space-y-4 order-3">
                 <div className="w-full max-w-md flex justify-center">
                    {phase === 'upload' ? (
                        renderUploadSlot(2)
                    ) : (
                        p2Card && (
                            <div className="w-full animate-in slide-in-from-right-20 duration-700">
                                <BattleCard 
                                    data={p2Card.data} 
                                    imageUrl={p2Card.imageUrl} 
                                    isBattleMode={true}
                                    isActive={activePlayerId === 2 && phase === 'battle_turn'}
                                    hasActed={actionsTaken.includes(2)}
                                    onMoveSelect={handleMoveSelect}
                                    isHurt={animatingHurtId === 2}
                                    damageEffect={damageOverlay?.targetId === 2 ? damageOverlay : null}
                                    onSave={(gameMode === 'pvp' || activePlayerId === 2) && p2Card.base64 ? () => handleSaveToGallery(p2Card) : undefined}
                                />
                            </div>
                        )
                    )}
                </div>
            </div>

      </div>
      
      {/* Modals are now strictly outside the main layout flow to ensure proper Z-Index stacking */}
      
      {/* Move Detail Modal */}
      {selectedMove && (
        <MoveDetailModal 
            move={selectedMove}
            isOpen={!!selectedMove}
            onClose={() => { setSelectedMove(null); playSfx('cancel'); }}
            onConfirm={executeMove}
            ownerName={activePlayerId === 1 ? p1Card?.data.title || '' : p2Card?.data.title || ''}
        />
      )}
      
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
      
      <GalleryModal 
        isOpen={showGallery} 
        onClose={() => setShowGallery(false)} 
        onSelect={handleSelectFromGallery} 
      />

      {/* Share Modal */}
      {phase === 'gameover' && showShare && (
          <ShareModal 
            isOpen={showShare}
            onClose={() => setShowShare(false)}
            winner={player1.currentHp > 0 ? player1 : player2}
            loser={player1.currentHp > 0 ? player2 : player1}
            winnerCard={player1.currentHp > 0 ? p1Card : p2Card}
            loserCard={player1.currentHp > 0 ? p2Card : p1Card}
          />
      )}
    </div>
  );
};

export default App;