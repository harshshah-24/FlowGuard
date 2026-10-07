export interface CliOptions {source?:string;format:'json'|'markdown';output?:string;overwrite:boolean;trace:boolean;run:boolean;inputs?:string;help:boolean;version:boolean}
export function parseOptions(args:string[]):CliOptions {
 const options:CliOptions={format:'json',overwrite:false,trace:false,run:false,help:false,version:false},seen=new Set<string>();
 for(let i=0;i<args.length;i++){const arg=args[i]!;if(!arg.startsWith('-')){if(options.source)throw new Error('Only one source file is allowed.');options.source=arg;continue;}
  if(seen.has(arg))throw new Error(`Duplicate flag: ${arg}`);seen.add(arg);
  const value=()=>{const next=args[++i];if(!next||next.startsWith('--'))throw new Error(`Missing value for ${arg}`);return next;};
  switch(arg){case '--help':options.help=true;break;case '--version':options.version=true;break;case '--overwrite':options.overwrite=true;break;case '--trace':options.trace=true;break;case '--run':options.run=true;break;case '--inputs':options.inputs=value();break;case '--output':options.output=value();break;case '--format':{const format=value();if(format!=='json'&&format!=='markdown')throw new Error('Format must be json or markdown.');options.format=format;break;}default:throw new Error(`Unknown flag: ${arg}`);}
 }
 if(options.overwrite&&!options.output)throw new Error('--overwrite requires --output.');if(options.inputs&&!options.run)throw new Error('--inputs requires --run.');
 if(options.help||options.version){if(args.length!==1)throw new Error('--help and --version must be used alone.');}else if(!options.source)throw new Error('A source file is required.');
 return options;
}
