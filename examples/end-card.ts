import type { SceneRequest } from '../packages/contracts/src/scene.ts';
/** Synthetic IDs only: real frame/logo/font assets must be supplied before rendering. */
export const example: SceneRequest = {
  blueprint: {
    schemaVersion: '0.1', id: 'scene_12', title: 'THE FINAL END CARD',
    canvas: {width:1920,height:1080,fps:30}, durationFrames:66, mode:'compositor',
    layout:{ctaGapPx:36,ctaFontSizePx:26,sparkleHeightPx:12},camera:'locked',exit:'hold',
    timeline:[{frame:0,opacity:0,yPx:6},{frame:3,opacity:0,yPx:6},{frame:9,opacity:1,yPx:0},{frame:65,opacity:1,yPx:0}],
    backgroundDescription:'Deep navy-black background with a soft emerald U-shaped light arc at the lower edges. Preserve the approved clean plate.',
    continuity:{previousSceneId:'scene_11',previousVersion:1}
  },
  brand:{id:'demo-brand',name:'megane.ai',logoAssetId:'demo-logo',
    colors:{primary:'#00C889',background:'#070D19',textMuted:'#8B999D'},
    fonts:{bodyAssetId:'demo-font',headingAssetId:'demo-font'}},
  cta:'Get started',
  assets:[{id:'demo-logo',brandId:'demo-brand',kind:'image'},{id:'demo-font',brandId:'demo-brand',kind:'font'},{id:'demo-clean-frame',brandId:'demo-brand',kind:'frame'}],
  continuity:{sceneId:'scene_11',version:1,brandId:'demo-brand',frameAssetId:'demo-clean-frame',cleanBackground:true,
    inheritedLogo:{assetId:'demo-logo',x:600,y:430,width:720,height:140}}
};
