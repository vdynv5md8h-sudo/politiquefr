/**
 * Services de synchronisation depuis les sources officielles
 * Remplace progressivement les appels à nosdeputes.fr par data.assemblee-nationale.fr
 */

export { synchroniserDeputesAN } from './deputes-an.service';
export { synchroniserTravauxParlementaires } from './travaux-parlementaires.service';
export { synchroniserCommissionsEnquete } from './commissions-enquete.service';
export { synchroniserScrutinsAN } from './scrutins-an.service';
export { genererResumes, genererResumeTravaux } from './resumes-llm.service';
export { synchroniserIndicateursInsee } from './indicateurs-insee.service';
