import numpy as np
from scipy.cluster.vq import kmeans2
def kq(arrs,n=15):
    px=np.concatenate([a[a[...,3]>0][:,:3] for a in arrs]).astype(float)
    np.random.seed(1); cb,_=kmeans2(px,n,minit='++',iter=30)
    out=[]
    for a in arrs:
        f=a[...,:3].reshape(-1,3).astype(float); d=((f[:,None]-cb[None])**2).sum(-1); q=cb[d.argmin(1)].reshape(a.shape[:2]+(3,))
        out.append(np.dstack([q,a[...,3]]).astype(np.uint8))
    return out
