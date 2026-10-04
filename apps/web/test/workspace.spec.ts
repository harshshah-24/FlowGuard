import { test,expect } from '@playwright/test';
test('foundation allows a draft but never pretends to analyze or execute',async({page})=>{
 await page.goto('/');
 await expect(page.getByText('Phase 0 · Foundation')).toBeVisible();
 await expect(page.getByRole('button',{name:'Analyze',exact:true})).toBeDisabled();
 await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
 await page.getByLabel('Write a FlowGuard program').fill('let n: int = 1;');
 await expect(page.getByRole('status')).toContainText('Draft updated');
 await expect(page.getByText('Revision 1')).toBeVisible();
 await page.getByRole('button',{name:'Help',exact:true}).click();
 await expect(page.getByRole('heading',{name:'About this foundation'})).toBeVisible();
 await page.getByRole('button',{name:'Workspace',exact:true}).click();
 await expect(page.getByLabel('Write a FlowGuard program')).toHaveValue('let n: int = 1;');
 await expect(page.getByRole('heading',{name:'No analysis results'})).toBeVisible();
 await page.screenshot({path:'test-results/phase-0-workspace.png',fullPage:true});
 await page.reload();
 await expect(page.getByLabel('Write a FlowGuard program')).toHaveValue('');
});
test('only loads locally packaged assets and renders a draft as text',async({page,context})=>{
 const external:string[]=[];
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!=='http://127.0.0.1:4173'){external.push(url.href);await route.abort();}else await route.continue();
 });
 await page.goto('/');
 await page.getByLabel('Write a FlowGuard program').fill('<img src=x onerror=alert(1)>');
 await expect(page.locator('img')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Analyze',exact:true})).toBeDisabled();
 expect(external).toEqual([]);
});
