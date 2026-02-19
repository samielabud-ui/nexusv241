
import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="py-20 px-4 text-center max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
        NexusBQ
      </h1>
      <p className="text-xl md:text-2xl text-neutral-400 font-light leading-relaxed">
        Plataforma de questões de medicina voltada para o método <span className="text-blue-500 font-medium">PBL</span>. 
        Organização, foco e excelência clínica em um só lugar.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <div className="px-4 py-2 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs text-neutral-400 uppercase tracking-widest font-semibold">
          Problem-Based Learning
        </div>
        <div className="px-4 py-2 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs text-neutral-400 uppercase tracking-widest font-semibold">
          Foco em Raciocínio Clínico
        </div>
      </div>
    </section>
  );
};

export default Hero;
