import sys; sys.path.insert(0,'/workspace')
from akm_common import *
from akm_kq import kq
from PIL import ImageEnhance
G='/workspace/game-assets/akumajo/dialog/'
im=Image.open(G+'src/witch_face_raw.jpg').convert('RGB').crop((110,20,950,860))
im=ImageEnhance.Color(im).enhance(1.3)
a=np.array(key(im)); s=shrink(Image.fromarray(a,'RGBA'),62/840)
q=kq([s],15)[0]; q=np.pad(q,((1,1),(1,1),(0,0))); q=outline(q)
out=Image.fromarray(q,'RGBA')
write_folder(G,[('witch_face',out)],{'witch_face':{'frames':['witch_face'],'ms':100,'loop':False}},lambda n,i:[0,0],{'notes':'64x64 dialogue portrait of 茨の魔女, transparent background, anchor top-left. Faces slightly left (toward the player on the left side of a dialog box, flip if needed).'})
Image.open(G+'preview.png').resize((64*4+32,64*4+32),0)
