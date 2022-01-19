tell("Demo 0 - Human bones");

startLoc = new FIK.V3();

// Head

// Arms
addTarget(new THREE.Vector3(-10, 2, 0));
addTarget(new THREE.Vector3(10, 2, 0));

// Legs
addTarget(new THREE.Vector3(-8, -30, 0));
addTarget(new THREE.Vector3(8, -30, 0));

// 0 spine
addSpine = function () {
    let angleLimit = 30,
        spineLength = 5,
        spineDirection = FIK.Y_AXE,
        color = 0xffff00,
        targetPosition = targets[0].position;

    const chain = new FIK.Chain3D(color);
    const basebone = new FIK.Bone3D(startLoc, new FIK.V3(0, 2, 0));

    // Set basebone as waist
    chain.addBone(basebone);
    chain.setRotorBaseboneConstraint("global", spineDirection, angleLimit);

    // Set spines
    chain.addConsecutiveRotorConstrainedBone(
        spineDirection,
        spineLength,
        angleLimit
    );
    chain.addConsecutiveRotorConstrainedBone(
        spineDirection,
        spineLength,
        angleLimit
    );
    chain.addConsecutiveRotorConstrainedBone(
        spineDirection,
        spineLength,
        angleLimit
    );
    chain.addConsecutiveRotorConstrainedBone(
        spineDirection,
        spineLength,
        angleLimit
    );

    // Link the chain to target
    solver.add(
        chain,
        targetPosition, // Where it ends
        true // Draw the spine
    );

    console.log(
        "Added Spine with",
        angleLimit,
        spineLength,
        spineDirection,
        color,
        targetPosition
    );
};

addSpine();

// 1 left arm

addArm = function (color, armDirection, targetPosition) {
    // Arm is the 3-rods chain
    // shoulder -> upperArm -> lowerArm -> [hand]
    let smallAngleLimit = 10,
        largeAngleLimit = 90,
        shoulderLength = 5,
        upperArmLength = 10,
        lowerArmLength = 10;

    // Init args if not defined
    // Use the left arm for default
    color = color || 0x44ff44;
    armDirection = armDirection || FIK.X_NEG;
    targetPosition = targetPosition || targets[1].position;

    const chain = new FIK.Chain3D();
    const basebone = new FIK.Bone3D(
        new FIK.V3(0, 20, 0),
        undefined, // We do not define the basebone with start - end nodes
        armDirection, // We use start - direction x length
        shoulderLength
    );

    // Shoulder with small (10 deg) rotation freedom
    chain.addBone(basebone);
    chain.setRotorBaseboneConstraint("global", armDirection, smallAngleLimit);

    // Arms with large (90 deg) rotation freedom
    chain.addConsecutiveRotorConstrainedBone(
        armDirection,
        upperArmLength,
        largeAngleLimit
    );
    chain.addConsecutiveRotorConstrainedBone(
        armDirection,
        lowerArmLength,
        largeAngleLimit
    );

    solver.connectChain(
        chain,
        0, // Link the first node in the chain
        3, // Link to the 4th bone, so make sure the spines are defined in prior
        "end", // The end of the 3th bone is linked
        targetPosition,
        true, //Draw the mesh of the arm
        color
    );

    console.log(
        "Add arm with",
        smallAngleLimit,
        largeAngleLimit,
        shoulderLength,
        upperArmLength,
        lowerArmLength,
        color,
        armDirection,
        targetPosition
    );
};

addArm();
addArm(0x4444ff, FIK.X_AXE, targets[2].position);

addLeg = function (color, legDirection, targetPosition) {
    // Leg is the 3-rods chain
    // hip -> upperLeg -> lowerLeg -> [foot]
    let smallAngleLimit = 10,
        largeAngleLimit = 90,
        hipLength = 5,
        upperLegLength = 15,
        lowerLegLength = 15;

    // Init args if not defined
    // Use the left leg for default
    color = color || 0x44ff44;
    legDirection = legDirection || FIK.X_NEG;
    targetPosition = targetPosition || targets[3].position;

    const chain = new FIK.Chain3D();
    const basebone = new FIK.Bone3D(
        new FIK.V3(0, 20, 0),
        undefined, // We do not define the basebone with start - end nodes
        legDirection, // We use start - direction x length
        hipLength
    );

    // Shoulder with small (10 deg) rotation freedom
    chain.addBone(basebone);
    chain.setRotorBaseboneConstraint("global", legDirection, smallAngleLimit);

    // UpperLeg with large (90 deg) rotation freedom
    chain.addConsecutiveRotorConstrainedBone(
        legDirection,
        upperLegLength,
        largeAngleLimit
    );

    // chain.addConsecutiveRotorConstrainedBone(
    //     legDirection,
    //     lowerLegLength,
    //     largeAngleLimit
    // );

    chain.addConsecutiveHingedBone(
        legDirection,
        lowerLegLength,
        "local",
        FIK.X_AXE,
        10,
        90,
        FIK.Z_AXE
    );

    solver.connectChain(
        chain,
        0, // Link the first node in the chain
        0, // Link to the first bone, so make sure the spines are defined in prior
        "start", // The start of the 3th bone is linked
        targetPosition,
        true, //Draw the mesh of the arm
        color
    );

    console.log(
        "Add leg with",
        smallAngleLimit,
        largeAngleLimit,
        hipLength,
        upperLegLength,
        lowerLegLength,
        color,
        legDirection,
        targetPosition
    );
};

addLeg();
addLeg(0x4444ff, FIK.X_AXE, targets[4].position);
