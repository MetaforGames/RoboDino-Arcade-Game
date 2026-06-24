import React, { useState, useEffect } from 'react';

export type HighScore = { initials: string, score: number };

export function Leaderboard({ 
  currentScore, 
  onComplete 
}: { 
  currentScore: number, 
  onComplete: () => void 
}) {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [initials, setInitials] = useState('');
  const [isTop10, setIsTop10] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
     let saved = [];
     try {
       saved = JSON.parse(localStorage.getItem('robodino-leaders') || '[]');
     } catch(e) {}
     setScores(saved);

     if (currentScore > 0) {
        if (saved.length < 10 || currentScore > (saved[saved.length - 1]?.score || 0)) {
           setIsTop10(true);
        }
     }
  }, [currentScore]);

  const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     if (initials.length < 1) return;
     
     const newScores = [...scores, { initials: initials.toUpperCase().slice(0,4), score: currentScore }]
       .sort((a,b) => b.score - a.score)
       .slice(0, 5); // display top 5 like image
       
     setScores(newScores);
     localStorage.setItem('robodino-leaders', JSON.stringify(newScores));
     setSubmitted(true);
  };

  return (
    <div className="w-full max-w-sm mt-6 flex flex-col items-center font-mono">
      <h3 className="text-xl font-bold text-green-500 mb-4 tracking-widest whitespace-nowrap">TOP 5 PLAYERS</h3>
      
      {isTop10 && !submitted && (
         <form onSubmit={handleSubmit} className="flex gap-2 mb-6 w-full">
           <input 
             type="text" 
             maxLength={4}
             value={initials}
             onChange={e => setInitials(e.target.value)}
             placeholder="NAME" 
             className="w-full bg-black/60 border-2 border-green-500 text-white font-bold p-2 text-center uppercase text-xl focus:outline-none"
             autoFocus
           />
           <button type="submit" className="bg-green-500 text-black font-black px-4 hover:bg-green-400">SAVE</button>
         </form>
      )}

      <div className="w-full relative">
         {scores.length === 0 ? (
            <p className="text-gray-500 text-center text-xs font-mono">NO RECORDS FOUND</p>
         ) : (
            <table className="w-full text-sm font-bold text-white text-right">
                <thead className="text-green-500 text-xs">
                    <tr>
                        <th className="text-left pb-2 w-8"></th>
                        <th className="pb-2 pr-4">SCORE</th>
                        <th className="pb-2 text-center">NAME</th>
                    </tr>
                </thead>
                <tbody>
                    {scores.map((s, i) => (
                        <tr key={i} className="leading-8">
                            <td className="text-left text-gray-300">{i+1}</td>
                            <td className="pr-4 tracking-wider">{s.score}</td>
                            <td className="text-center tracking-widest">{s.initials}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
         )}
      </div>
    </div>
  );
}
