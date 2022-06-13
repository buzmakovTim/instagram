const ig = require('./instagram');

(async () => {
        
    await ig.initialize();
    
    await ig.login('userName', 'password');
    
    await ig.likeTagsProcess(['caferacer', 'motorcycle', 'caferacergram', 'bikersofinstagram', 'caferacersofinstagram', 'caferacers', 'motorcycles', 
                                'motorcyclelife', 'moto', 'triumph', 'classicbike', 'triumphmotorcycles', 'motorbike', 'bikersofinstagram', 
                                'bikerslife', 'motolife', 'custombike']);
                            })()


                            // await ig.likeTagsProcess(['caferacer', 'motorcycle', 'caferacergram', 'bikersofinstagram', 'caferacersofinstagram', 'caferacers', 'motorcycles', 
                            //     'motorcyclelife', 'moto', 'triumph', 'classicbike', 'bikers', 'triumphmotorcycles', 'motorbike', 'bikersofinstagram', 
                            //     'bikerslife', 'motolife', 'custombike']);
                            // })()