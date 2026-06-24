import React from 'react';
import { Trophy, Star, Shield, Zap, Skull, Activity, TreePine } from 'lucide-react';

export type AchievementData = {
    veloDistance: number;
    obstaclesDestroyed: number;
    robotTransforms: number;
    hitSpike: number;
    hitHole: number;
    hitTree: number;
};

export const getLevel = (count: number, milestones: number[]) => {
    let level = 0;
    for (let i = 0; i < milestones.length; i++) {
        if (count >= milestones[i]) level = i + 1;
    }
    return level;
};

export const MILESTONES = {
    veloDist: [100, 500, 1000, 3000, 10000, 20000],
    obsDest: [1, 25, 50, 100, 200, 500, 1000, 5000, 10000],
    robot: [1, 5, 10, 20, 50, 100],
    spike: [1, 10, 100, 1000],
    hole: [1, 10, 100, 1000],
    tree: [1, 10, 100, 1000]
};

const Badge = ({ level, max, icon: Icon, title, desc, progress, required }: any) => {
    const isMax = level === max;
    const isUnlocked = level > 0;
    const color = isMax ? 'text-yellow-400' : isUnlocked ? 'text-cyan-400' : 'text-gray-600';
    const bg = isMax ? 'bg-yellow-900/30 border-yellow-500' : isUnlocked ? 'bg-cyan-900/30 border-cyan-500' : 'bg-gray-900/30 border-gray-700';

    return (
        <div className={`p-3 border-2 flex items-center gap-3 ${bg} relative overflow-hidden backdrop-blur-sm`}>
            {isMax && <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-transparent" />}
            <div className={`w-10 h-10 flex items-center justify-center rounded-full border border-current ${color} bg-black/50 shadow-inner`}>
                <Icon className={`w-5 h-5 ${isMax ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : ''}`} />
            </div>
            <div className="flex-1 z-10">
                <div className="flex justify-between items-end">
                    <h4 className={`text-sm font-black italic tracking-wider transform -skew-x-12 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{title} {isUnlocked && <span className={color}>Lv.{level}</span>}</h4>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight mt-1">{desc}</p>
                <div className="w-full bg-black/50 h-1.5 mt-2 overflow-hidden border border-gray-800">
                    <div className={`h-full ${isMax ? 'bg-yellow-400' : 'bg-cyan-500'} transition-all`} style={{ width: `${Math.min(100, (progress / required) * 100)}%` }} />
                </div>
                <div className="text-[8px] text-right text-gray-500 mt-0.5 font-mono">
                    {Math.floor(progress)} / {required}
                </div>
            </div>
        </div>
    );
};

export function Achievements({ stats, onClose }: { stats: AchievementData, onClose: () => void }) {
    const veloLevel = getLevel(stats.veloDistance, MILESTONES.veloDist);
    const obsLevel = getLevel(stats.obstaclesDestroyed, MILESTONES.obsDest);
    const robotLevel = getLevel(stats.robotTransforms, MILESTONES.robot);
    const spikeLevel = getLevel(stats.hitSpike, MILESTONES.spike);
    const holeLevel = getLevel(stats.hitHole, MILESTONES.hole);
    const treeLevel = getLevel(stats.hitTree, MILESTONES.tree);

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0a192f] border-4 border-cyan-500 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-3 flex justify-between items-center border-b-2 border-cyan-300">
                    <div className="flex items-center gap-2">
                        <Trophy className="text-yellow-400 w-5 h-5 drop-shadow-md" />
                        <h2 className="text-white font-black italic tracking-widest text-lg transform -skew-x-12 drop-shadow-md">LIFETIME ACHIEVEMENTS</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-cyan-200 font-black px-2">X</button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 custom-scrollbar">
                    <Badge 
                        level={veloLevel} max={MILESTONES.veloDist.length} 
                        icon={Zap} title="SPEED DEMON" 
                        desc="Distance traveled at full speed on Velociraptor."
                        progress={stats.veloDistance} 
                        required={MILESTONES.veloDist[Math.min(veloLevel, MILESTONES.veloDist.length - 1)]} 
                    />
                    <Badge 
                        level={obsLevel} max={MILESTONES.obsDest.length} 
                        icon={Shield} title="BULLDOZER" 
                        desc="Obstacles destroyed using T-Rex or Triceratops."
                        progress={stats.obstaclesDestroyed} 
                        required={MILESTONES.obsDest[Math.min(obsLevel, MILESTONES.obsDest.length - 1)]} 
                    />
                    <Badge 
                        level={robotLevel} max={MILESTONES.robot.length} 
                        icon={Star} title="MECHA WARRIOR" 
                        desc="Times transformed into Robot. (Lv.5: Golden Skin)"
                        progress={stats.robotTransforms} 
                        required={MILESTONES.robot[Math.min(robotLevel, MILESTONES.robot.length - 1)]} 
                    />
                    <Badge 
                        level={spikeLevel} max={MILESTONES.spike.length} 
                        icon={Skull} title="PINCUSHION" 
                        desc="Times you hit a spike rock."
                        progress={stats.hitSpike} 
                        required={MILESTONES.spike[Math.min(spikeLevel, MILESTONES.spike.length - 1)]} 
                    />
                    <Badge 
                        level={holeLevel} max={MILESTONES.hole.length} 
                        icon={Activity} title="MINER" 
                        desc="Times you fell inside a pothole."
                        progress={stats.hitHole} 
                        required={MILESTONES.hole[Math.min(holeLevel, MILESTONES.hole.length - 1)]} 
                    />
                    <Badge 
                        level={treeLevel} max={MILESTONES.tree.length} 
                        icon={TreePine} title="LUMBERJACK" 
                        desc="Times you slammed into a tree."
                        progress={stats.hitTree} 
                        required={MILESTONES.tree[Math.min(treeLevel, MILESTONES.tree.length - 1)]} 
                    />
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #06b6d4;
                    border-radius: 3px;
                }
            `}} />
        </div>
    );
}
