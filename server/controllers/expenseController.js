const Expense=require('../models/Expense');
const getAll=async(req,res)=>{try{const items=await Expense.find({user:req.user.id}).sort({createdAt:-1});res.json({success:true,count:items.length,data:items});}catch(e){res.status(500).json({error:'Server error',message:e.message});}};
const create=async(req,res)=>{try{
  console.log('CREATE EXPENSE:', req.body);
  const expenseData = {
    ...req.body,
    user: req.user.id,
    paymentMethod: req.body.paymentMethod?.toLowerCase().replace(' ', '_') || 'upi',
    category: req.body.category?.toLowerCase() || 'other'
  };
  const item=await Expense.create(expenseData);
  console.log('EXPENSE CREATED:', item._id);
  res.status(201).json({success:true,data:item});
}catch(e){console.error('EXPENSE ERROR:', e.message);res.status(500).json({error:'Server error',message:e.message});}};
const update=async(req,res)=>{try{const item=await Expense.findOneAndUpdate({_id:req.params.id,user:req.user.id},req.body,{new:true});if(!item)return res.status(404).json({error:'Not found'});res.json({success:true,data:item});}catch(e){res.status(500).json({error:'Server error',message:e.message});}};
const remove=async(req,res)=>{try{const item=await Expense.findOneAndDelete({_id:req.params.id,user:req.user.id});if(!item)return res.status(404).json({error:'Not found'});res.json({success:true,message:'Deleted'});}catch(e){res.status(500).json({error:'Server error',message:e.message});}};
module.exports={getAll,create,update,remove};