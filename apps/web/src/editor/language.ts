import type * as Monaco from 'monaco-editor';
export function registerLanguage(monaco:Pick<typeof Monaco,'languages'>):void{
 monaco.languages.register({id:'flowguard',extensions:['.fg']});
 monaco.languages.setLanguageConfiguration('flowguard',{comments:{lineComment:'//',blockComment:['/*','*/']},brackets:[['{','}'],['(',')']],autoClosingPairs:[{open:'{',close:'}'},{open:'(',close:')'},{open:'"',close:'"',notIn:['string','comment']}],surroundingPairs:[{open:'{',close:'}'},{open:'(',close:')'},{open:'"',close:'"'}]});
 monaco.languages.setMonarchTokensProvider('flowguard',{
  keywords:['let','if','else','while','true','false'],typeKeywords:['string','int','bool'],builtins:['input','print','sql_query','sql_bind','shell'],
  tokenizer:{root:[[/[A-Za-z_][A-Za-z0-9_]*/,{cases:{'@keywords':'keyword','@typeKeywords':'type','@builtins':'predefined','@default':'identifier'}}],[/\/\/.*$/,'comment'],[/\/\*/,'comment','@comment'],[/"/,'string','@string'],[/\d+/,'number'],[/&&|\|\||==|!=|<=|>=|[+\-*\/%!<>=]/,'operator'],[/[{}()]/,'@brackets'],[/[;:,]/,'delimiter']],comment:[[/[^*/]+/,'comment'],[/\*\//,'comment','@pop'],[/[*/]/,'comment']],string:[[/[^\\"\r\n]+/,'string'],[/\\["\\nrt]/,'string.escape'],[/\\./,'invalid'],[/"/,'string','@pop'],[/$/,'invalid','@pop']]}
 });
}
