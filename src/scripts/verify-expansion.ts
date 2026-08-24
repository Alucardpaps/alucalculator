import { MaterialService } from '../materials/material-service';

async function verify() {
    console.log("--- AluCalc OS Expansion Verification ---");
    
    // 1. Material Loading Test
    console.log("1. Loading materials...");
    await MaterialService.loadMaterials('./src/engine/knowledge-base');
    const materials = MaterialService.listMaterials();
    console.log(`Found ${materials.length} material categories.`);
    
    const wood = MaterialService.getMaterial('Structural Pine');
    if (wood) console.log("✅ Wood properties loaded.");
    else console.log("❌ Wood properties missing.");

    // 2. Financial Service Test
    console.log("2. Testing live prices...");
    await MaterialService.updateMaterialPrice('aluminum');
    const al = MaterialService.getMaterial('aluminum');
    if (al?.livePrice) {
        console.log(`✅ Live pricing integrated: ${al.livePrice.value} ${al.livePrice.currency}/${al.livePrice.unit}`);
    } else {
        console.log("❌ Live pricing failed.");
    }

    console.log("Verification complete.");
}

verify().catch(console.error);
